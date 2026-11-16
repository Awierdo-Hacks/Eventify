import 'server-only';
import { db } from '@/lib/db';
import { googleCalendarConfigured } from '@/features/calendar/google';
import { syncWindow } from '@/features/calendar/sync';

export async function getAgenda(providerId: string) {
  const { from, to } = syncWindow();
  const now = new Date();

  const [blocked, bookings, external, integrations] = await Promise.all([
    db.blockedDate.findMany({
      where: { provider_id: providerId, date: { gte: from, lte: to } },
      select: { date: true, reason: true },
    }),
    db.booking.findMany({
      where: {
        provider_id: providerId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        event_date: { gte: from },
      },
      select: {
        event_date: true,
        customer: { select: { name: true } },
        request: { select: { event_type: true } },
      },
      orderBy: { event_date: 'asc' },
    }),
    db.externalCalendarEvent.findMany({
      where: {
        integration: { provider_id: providerId, is_active: true },
        start_date: { gte: from, lte: to },
      },
      select: { start_date: true, integration: { select: { type: true } } },
    }),
    db.calendarIntegration.findMany({
      where: { provider_id: providerId },
      select: {
        type: true,
        google_account_email: true,
        ical_url: true,
        last_synced_at: true,
        sync_error: true,
      },
    }),
  ]);

  const key = (date: Date) => date.toISOString().slice(0, 10);
  const upcoming = bookings.filter((booking) => booking.event_date >= now);
  const perMonth = new Map<string, number>();
  for (const booking of upcoming) {
    const month = key(booking.event_date).slice(0, 7);
    perMonth.set(month, (perMonth.get(month) ?? 0) + 1);
  }
  const busiest = [...perMonth.entries()].sort((a, b) => b[1] - a[1])[0];

  const google = integrations.find((integration) => integration.type === 'GOOGLE');
  const icalIntegration = integrations.find((integration) => integration.type === 'ICAL');

  return {
    blocked: blocked.map((row) => ({ date: key(row.date), reason: row.reason })),
    booked: bookings.map((row) => ({
      date: key(row.event_date),
      customer: row.customer.name,
      eventType: row.request.event_type,
    })),
    external: external.map((row) => ({
      date: key(row.start_date),
      source: row.integration.type as string,
    })),
    nextBooking: upcoming[0]
      ? {
          date: upcoming[0].event_date.toISOString(),
          customer: upcoming[0].customer.name,
          eventType: upcoming[0].request.event_type,
        }
      : null,
    busiestMonth: busiest ? { month: busiest[0], count: busiest[1] } : null,
    upcomingCount: upcoming.length,
    sync: {
      googleAvailable: googleCalendarConfigured(),
      google: google
        ? {
            email: google.google_account_email,
            lastSynced: google.last_synced_at?.toISOString() ?? null,
            error: google.sync_error,
          }
        : null,
      ical: icalIntegration
        ? {
            // Calendar links are secrets: show only the host.
            host: (() => {
              try {
                return new URL(icalIntegration.ical_url ?? '').hostname;
              } catch {
                return 'onbekend';
              }
            })(),
            lastSynced: icalIntegration.last_synced_at?.toISOString() ?? null,
            error: icalIntegration.sync_error,
          }
        : null,
    },
  };
}

export type AgendaData = Awaited<ReturnType<typeof getAgenda>>;
