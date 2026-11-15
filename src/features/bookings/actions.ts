'use server';

import { db } from '@/lib/db';
import { fail, ok, GENERIC_ERROR, type ActionResult } from '@/lib/action';
import { revalidateApp } from '@/lib/revalidate';
import { getCurrentUser } from '@/lib/session';

const TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

/** Provider (or admin) moves a booking to its next status. */
export async function updateBookingStatusAction(input: {
  bookingId: string;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail('Je bent niet meer ingelogd. Log opnieuw in.');

  try {
    const booking = await db.booking.findUnique({
      where: { id: input.bookingId },
      select: { id: true, provider_id: true, status: true, event_date: true, request_id: true },
    });
    const allowed = booking && (user.role === 'ADMIN' || (user.providerId && booking.provider_id === user.providerId));
    if (!booking || !allowed) return fail('Deze boeking bestaat niet (meer).');
    if (!TRANSITIONS[booking.status]?.includes(input.status)) {
      return fail('Deze statuswijziging is niet mogelijk.');
    }
    if (input.status === 'COMPLETED' && booking.event_date.getTime() > Date.now()) {
      return fail('Je kunt een boeking pas afronden na de datum van het event.');
    }

    await db.$transaction(async (tx) => {
      await tx.booking.update({ where: { id: booking.id }, data: { status: input.status } });
      if (input.status === 'CANCELLED') {
        // Free the event slot so the customer can pick another provider.
        const quotes = await tx.quote.findMany({
          where: { request_id: booking.request_id, accepted: true },
          select: { id: true, event_slot_id: true },
        });
        for (const quote of quotes) {
          if (quote.event_slot_id) {
            await tx.eventSlot.updateMany({
              where: { id: quote.event_slot_id, booked_quote_id: quote.id },
              data: { booked_quote_id: null, status: 'EMPTY' },
            });
          }
        }
        await tx.serviceRequest.update({ where: { id: booking.request_id }, data: { status: 'CANCELLED' } });
      }
    });
  } catch (error) {
    console.error('[bookings] status update failed', error);
    return fail(GENERIC_ERROR);
  }

  revalidateApp();
  const messages = { CONFIRMED: 'Boeking bevestigd.', COMPLETED: 'Boeking afgerond.', CANCELLED: 'Boeking geannuleerd.' };
  return ok(undefined, messages[input.status]);
}
