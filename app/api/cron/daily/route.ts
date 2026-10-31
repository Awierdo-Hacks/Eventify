import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { addMonths, endOfMonth, startOfMonth } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { postSystemMessage, recomputeSlotStatus } from '@/lib/workflow';

// Long enough for the calendar sync of all providers
export const maxDuration = 300;

const AUTO_COMPLETE_AFTER_MS = 48 * 60 * 60 * 1000;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get('authorization') ?? '';
  if (!secret) return false;
  const expected = `Bearer ${secret}`;
  return header.length === expected.length && timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

/**
 * Daily maintenance (Vercel Cron, see vercel.json):
 * - confirmed bookings are completed automatically 48h after the event
 * - events whose date has passed become COMPLETED
 * - slots are re-evaluated so expired quotes stop counting
 * - Google/iCal calendars are synced for the coming months
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const summary = { bookingsCompleted: 0, eventsCompleted: 0, slotsRefreshed: 0, calendarsSynced: 0, calendarErrors: 0 };

  // 1. Auto-complete bookings
  const dueBookings = await prisma.booking.findMany({
    where: { status: 'CONFIRMED', event_date: { lt: new Date(now.getTime() - AUTO_COMPLETE_AFTER_MS) } },
    select: { id: true, customer_id: true, event_date: true, provider: { select: { user_id: true, business_name: true } } },
  });
  for (const booking of dueBookings) {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.updateMany({
        where: { id: booking.id, status: 'CONFIRMED' },
        data: { status: 'COMPLETED', completed_at: now },
      });
      if (updated.count === 0) return;
      await postSystemMessage(
        tx,
        booking.provider.user_id,
        booking.customer_id,
        `🎉 Je event van ${booking.event_date.toLocaleDateString('nl-BE', { timeZone: 'UTC' })} is afgerond. Laat je een review achter voor ${booking.provider.business_name}?`
      );
    });
    summary.bookingsCompleted++;
  }

  // 2. Events in the past are completed (only those that had bookings)
  const todayStart = new Date(`${now.toISOString().split('T')[0]}T00:00:00.000Z`);
  const events = await prisma.event.updateMany({
    where: { status: 'ACTIVE', event_date: { lt: todayStart } },
    data: { status: 'COMPLETED' },
  });
  summary.eventsCompleted = events.count;

  // 3. Slots waiting on quotes: expired quotes no longer count
  const slots = await prisma.eventSlot.findMany({
    where: { status: { in: ['QUOTES_RECEIVED', 'QUOTES_REQUESTED'] }, event: { status: { in: ['PLANNING', 'ACTIVE'] } } },
    select: { id: true },
  });
  for (const slot of slots) {
    await prisma.$transaction((tx) => recomputeSlotStatus(tx, slot.id));
    summary.slotsRefreshed++;
  }

  // 4. Calendar sync for the current and next 3 months
  const integrations = await prisma.calendarIntegration.findMany({
    where: { is_active: true },
    select: { id: true, type: true },
  });
  const from = startOfMonth(now);
  const to = endOfMonth(addMonths(now, 3));
  for (const integration of integrations) {
    try {
      if (integration.type === 'GOOGLE') {
        const { syncGoogleCalendar } = await import('@/lib/googleCalendarSync');
        await syncGoogleCalendar(integration.id, from, to);
      } else {
        const { syncIcalCalendar } = await import('@/lib/icalSync');
        await syncIcalCalendar(integration.id, from, to);
      }
      summary.calendarsSynced++;
    } catch (error) {
      summary.calendarErrors++;
      console.error(`Calendar sync failed for integration ${integration.id}:`, error);
    }
  }

  return NextResponse.json({ ok: true, ranAt: now.toISOString(), ...summary });
}
