import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProvider } from '@/lib/middleware/auth';

// GET - Haal geblokkeerde datums en geboekte datums op voor de ingelogde provider
export async function GET(request: NextRequest) {
  // Stap 1: Auth check
  let session;
  try {
    const authResult = await requireProvider();
    if (authResult.error) return authResult.error;
    session = authResult.session;
  } catch (error) {
    console.error('Blocked dates auth error:', error);
    return NextResponse.json(
      { error: 'Authenticatie fout' },
      { status: 401 }
    );
  }

  const providerId = session!.providerId!;

  // Stap 2: Parse datum filter
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (from) dateFilter.gte = new Date(from + 'T00:00:00.000Z');
  if (to) dateFilter.lte = new Date(to + 'T23:59:59.999Z');

  const hasDateFilter = Object.keys(dateFilter).length > 0;

  // Stap 3: Ophalen data
  let blockedDates: any[] = [];
  let bookings: any[] = [];
  let nextBooking: any = null;
  let busiestMonth: { month: string; count: number } | null = null;

  try {
    blockedDates = await prisma.blockedDate.findMany({
      where: {
        provider_id: providerId,
        ...(hasDateFilter ? { date: dateFilter } : {}),
      },
      orderBy: { date: 'asc' },
    });
  } catch (error) {
    console.error('BlockedDate query error:', error);
  }

  try {
    bookings = await prisma.booking.findMany({
      where: {
        provider_id: providerId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        ...(hasDateFilter ? { event_date: dateFilter } : {}),
      },
      select: {
        id: true,
        event_date: true,
        customer: { select: { name: true } },
        request: { select: { event_type: true } },
      },
      orderBy: { event_date: 'asc' },
    });
  } catch (error) {
    console.error('Booking query error:', error);
  }

  // Volgende boeking: altijd de eerstvolgende, ongeacht datumfilter
  try {
    const next = await prisma.booking.findFirst({
      where: {
        provider_id: providerId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        event_date: { gte: new Date() },
      },
      select: {
        event_date: true,
        customer: { select: { name: true } },
        request: { select: { event_type: true } },
      },
      orderBy: { event_date: 'asc' },
    });
    if (next) {
      nextBooking = {
        date: next.event_date instanceof Date
          ? next.event_date.toISOString().split('T')[0]
          : String(next.event_date).split('T')[0],
        customerName: next.customer?.name ?? 'Onbekend',
        eventType: next.request?.event_type ?? null,
      };
    }
  } catch (error) {
    console.error('Next booking query error:', error);
  }

  // Drukste maand: tel boekingen per maand over alle toekomstige boekingen
  try {
    const allFutureBookings = await prisma.booking.findMany({
      where: {
        provider_id: providerId,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: { event_date: true },
    });

    const monthCounts: Record<string, number> = {};
    for (const b of allFutureBookings) {
      const d = b.event_date instanceof Date ? b.event_date : new Date(b.event_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[key] = (monthCounts[key] || 0) + 1;
    }

    const sorted = Object.entries(monthCounts).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      busiestMonth = { month: sorted[0][0], count: sorted[0][1] };
    }
  } catch (error) {
    console.error('Busiest month query error:', error);
  }

  // Externe kalender events ophalen
  let externalEvents: { date: string; title: string | null; source: string }[] = [];
  try {
    const integrations = await prisma.calendarIntegration.findMany({
      where: { provider_id: providerId, is_active: true },
      select: { id: true, type: true },
    });

    if (integrations.length > 0) {
      const integrationIds = integrations.map((i) => i.id);
      const typeMap = Object.fromEntries(integrations.map((i: { id: string; type: string }) => [i.id, i.type]));

      const rawExternal = await prisma.externalCalendarEvent.findMany({
        where: {
          integration_id: { in: integrationIds },
          ...(hasDateFilter ? { start_date: dateFilter } : {}),
        },
        select: { start_date: true, title: true, integration_id: true },
        orderBy: { start_date: 'asc' },
      });

      externalEvents = rawExternal.map((e: { start_date: Date; title: string | null; integration_id: string }) => ({
        date: e.start_date instanceof Date
          ? e.start_date.toISOString().split('T')[0]
          : String(e.start_date).split('T')[0],
        title: e.title,
        source: typeMap[e.integration_id] ?? 'EXTERNAL',
      }));
    }
  } catch (error) {
    console.error('External events query error:', error);
  }

  return NextResponse.json({
    blockedDates: blockedDates.map((d) => ({
      id: d.id,
      date: d.date instanceof Date ? d.date.toISOString().split('T')[0] : String(d.date).split('T')[0],
      reason: d.reason,
      createdAt: d.created_at,
    })),
    bookedDates: bookings.map((b) => ({
      date: b.event_date instanceof Date ? b.event_date.toISOString().split('T')[0] : String(b.event_date).split('T')[0],
      bookingId: b.id,
      customerName: b.customer?.name ?? 'Onbekend',
      eventType: b.request?.event_type ?? null,
    })),
    externalEvents,
    nextBooking,
    busiestMonth,
  });
}

// POST - Blokkeer een of meerdere datums
export async function POST(request: NextRequest) {
  try {
    const { error, session } = await requireProvider();
    if (error) return error;

    const body = await request.json();
    const { dates, reason } = body as { dates: string[]; reason?: string };

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json(
        { error: 'Geef minimaal één datum op' },
        { status: 400 }
      );
    }

    const providerId = session!.providerId!;
    const trimmedReason = reason?.trim() || null;
    let created = 0;

    for (const dateStr of dates) {
      try {
        await prisma.blockedDate.upsert({
          where: {
            provider_id_date: {
              provider_id: providerId,
              date: new Date(dateStr + 'T00:00:00.000Z'),
            },
          },
          update: { reason: trimmedReason },
          create: {
            provider_id: providerId,
            date: new Date(dateStr + 'T00:00:00.000Z'),
            reason: trimmedReason,
          },
        });
        created++;
      } catch (err) {
        console.error(`Failed to block date ${dateStr}:`, err);
      }
    }

    return NextResponse.json({ success: true, count: created });
  } catch (error) {
    console.error('Blocked dates POST error:', error);
    const message = error instanceof Error ? error.message : 'Onbekende fout';
    return NextResponse.json(
      { error: `Kon datums niet blokkeren: ${message}` },
      { status: 500 }
    );
  }
}

// DELETE - Deblokkeer een of meerdere datums
export async function DELETE(request: NextRequest) {
  try {
    const { error, session } = await requireProvider();
    if (error) return error;

    const body = await request.json();
    const { dates } = body as { dates: string[] };

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json(
        { error: 'Geef minimaal één datum op' },
        { status: 400 }
      );
    }

    const parsedDates = dates.map((d) => new Date(d + 'T00:00:00.000Z'));

    await prisma.blockedDate.deleteMany({
      where: {
        provider_id: session!.providerId!,
        date: { in: parsedDates },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Blocked dates DELETE error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het deblokkeren van datums' },
      { status: 500 }
    );
  }
}
