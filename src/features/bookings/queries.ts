import 'server-only';
import { db } from '@/lib/db';
import type { Prisma } from '@/generated/prisma/client';

const bookingSelect = {
  id: true,
  event_date: true,
  event_location: true,
  guest_count: true,
  final_price: true,
  status: true,
  created_at: true,
  provider_id: true,
  customer: { select: { id: true, name: true, email: true, phone: true, deleted_at: true } },
  provider: {
    select: { id: true, user_id: true, business_name: true, category: true, location: true },
  },
  request: {
    select: {
      event_type: true,
      customer_phone: true,
      customer_email: true,
      quotes: {
        where: { accepted: true },
        select: { message: true, included_services: true, terms: true },
        take: 1,
      },
    },
  },
} satisfies Prisma.BookingSelect;

export async function getCustomerBookings(customerId: string) {
  const [bookings, reviews] = await Promise.all([
    db.booking.findMany({
      where: { customer_id: customerId },
      select: bookingSelect,
      orderBy: { event_date: 'asc' },
      take: 100,
    }),
    db.review.findMany({
      where: { customer_id: customerId },
      select: { provider_id: true, event_date: true },
    }),
  ]);
  const reviewed = new Set(
    reviews.map((review) => `${review.provider_id}:${review.event_date.getTime()}`)
  );
  return bookings.map((booking) => ({
    ...booking,
    reviewed: reviewed.has(`${booking.provider_id}:${booking.event_date.getTime()}`),
  }));
}

export async function getProviderBookings(providerId: string) {
  return db.booking.findMany({
    where: { provider_id: providerId },
    select: bookingSelect,
    orderBy: { event_date: 'asc' },
    take: 200,
  });
}

export type CustomerBooking = Awaited<ReturnType<typeof getCustomerBookings>>[number];
export type ProviderBooking = Awaited<ReturnType<typeof getProviderBookings>>[number];

/** Upcoming first (soonest on top), then past (most recent on top). */
export function splitByDate<T extends { event_date: Date; status: string }>(bookings: T[]) {
  const now = Date.now();
  const upcoming = bookings.filter(
    (booking) =>
      booking.event_date.getTime() >= now &&
      booking.status !== 'CANCELLED' &&
      booking.status !== 'COMPLETED'
  );
  const past = bookings.filter((booking) => !upcoming.includes(booking)).reverse();
  return { upcoming, past };
}

/** True once the event date is in the past. */
export function hasPassed(date: Date): boolean {
  return date.getTime() <= Date.now();
}
