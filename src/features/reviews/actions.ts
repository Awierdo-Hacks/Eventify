'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { fail, invalid, ok, GENERIC_ERROR, type ActionResult } from '@/lib/action';
import { invalidateProviders } from '@/lib/cache';
import { revalidateApp } from '@/lib/revalidate';
import { getCurrentUser } from '@/lib/session';

const reviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.coerce.number().int().min(1, 'Kies een aantal sterren.').max(5),
  title: z.string().trim().min(3, 'Geef je beoordeling een titel.').max(120),
  comment: z.string().trim().min(20, 'Vertel iets meer (minstens 20 tekens).').max(2000),
});

export type ReviewInput = z.input<typeof reviewSchema>;

/**
 * Only a customer with a completed booking can review, once per booking.
 * This is what "verified review" means on the site.
 */
export async function createReviewAction(input: ReviewInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail('Je bent niet meer ingelogd. Log opnieuw in.');
  if (user.role !== 'CUSTOMER') return fail('Alleen klanten kunnen een beoordeling plaatsen.');

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  try {
    const booking = await db.booking.findUnique({
      where: { id: data.bookingId },
      select: {
        id: true,
        customer_id: true,
        provider_id: true,
        status: true,
        event_date: true,
        request: { select: { event_type: true } },
      },
    });
    if (!booking || booking.customer_id !== user.id)
      return fail('Deze boeking bestaat niet (meer).');
    if (booking.status !== 'COMPLETED')
      return fail('Je kunt pas een beoordeling plaatsen na een afgeronde boeking.');

    const existing = await db.review.findFirst({
      where: {
        customer_id: user.id,
        provider_id: booking.provider_id,
        event_date: booking.event_date,
      },
      select: { id: true },
    });
    if (existing) return fail('Je hebt voor deze boeking al een beoordeling geplaatst.');

    await db.$transaction(async (tx) => {
      await tx.review.create({
        data: {
          customer_id: user.id,
          provider_id: booking.provider_id,
          rating: data.rating,
          title: data.title,
          comment: data.comment,
          event_type: booking.request.event_type,
          event_date: booking.event_date,
        },
      });
      const stats = await tx.review.aggregate({
        where: { provider_id: booking.provider_id },
        _avg: { rating: true },
        _count: { _all: true },
      });
      await tx.serviceProvider.update({
        where: { id: booking.provider_id },
        data: { rating_avg: stats._avg.rating ?? 0, review_count: stats._count._all },
      });
    });
  } catch (error) {
    console.error('[reviews] create failed', error);
    return fail(GENERIC_ERROR);
  }

  invalidateProviders();
  revalidateApp();
  return ok(undefined, 'Bedankt voor je beoordeling!');
}
