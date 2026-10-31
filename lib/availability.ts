import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';

type Db = typeof prisma | Prisma.TransactionClient;

/** Calendar day key (UTC), the format used by date pickers and BlockedDate. */
export function toDayKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function dayRange(date: Date) {
  const start = new Date(`${toDayKey(date)}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/**
 * All days a provider can't be booked: manually blocked days, active
 * bookings and busy days from synced Google/iCal calendars.
 */
export async function getUnavailableDates(
  providerId: string,
  range: { from?: Date | null; to?: Date | null } = {},
  db: Db = prisma
): Promise<string[]> {
  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (range.from) dateFilter.gte = range.from;
  if (range.to) dateFilter.lte = range.to;
  const dateWhere = Object.keys(dateFilter).length > 0 ? dateFilter : undefined;

  const [blockedDates, bookings, externalEvents] = await Promise.all([
    db.blockedDate.findMany({
      where: { provider_id: providerId, ...(dateWhere ? { date: dateWhere } : {}) },
      select: { date: true },
    }),
    db.booking.findMany({
      where: {
        provider_id: providerId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        ...(dateWhere ? { event_date: dateWhere } : {}),
      },
      select: { event_date: true },
    }),
    db.externalCalendarEvent.findMany({
      where: {
        integration: { provider_id: providerId, is_active: true },
        ...(dateWhere ? { start_date: dateWhere } : {}),
      },
      select: { start_date: true },
    }),
  ]);

  const unavailable = new Set<string>();
  for (const d of blockedDates) unavailable.add(toDayKey(d.date));
  for (const b of bookings) unavailable.add(toDayKey(b.event_date));
  for (const e of externalEvents) unavailable.add(toDayKey(e.start_date));
  return Array.from(unavailable).sort();
}

/**
 * Whether a provider is free on the given day. Pass excludeBookingId to
 * ignore a booking that is being re-checked itself.
 */
export async function isProviderAvailable(
  providerId: string,
  date: Date,
  options: { excludeBookingId?: string } = {},
  db: Db = prisma
): Promise<boolean> {
  const { start, end } = dayRange(date);

  const [blocked, booking, external] = await Promise.all([
    db.blockedDate.findFirst({
      where: { provider_id: providerId, date: { gte: start, lt: end } },
      select: { id: true },
    }),
    db.booking.findFirst({
      where: {
        provider_id: providerId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        event_date: { gte: start, lt: end },
        ...(options.excludeBookingId ? { id: { not: options.excludeBookingId } } : {}),
      },
      select: { id: true },
    }),
    db.externalCalendarEvent.findFirst({
      where: {
        integration: { provider_id: providerId, is_active: true },
        start_date: { gte: start, lt: end },
      },
      select: { id: true },
    }),
  ]);

  return !blocked && !booking && !external;
}
