'use server';

import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { fail, invalid, GENERIC_ERROR, type ActionResult } from '@/lib/action';
import { toDateKey } from '@/lib/format';
import { limitByIp, TOO_MANY_REQUESTS } from '@/lib/rate-limit';
import { revalidateApp } from '@/lib/revalidate';
import { getCurrentUser } from '@/lib/session';
import { getUnavailableDates } from '@/features/providers/queries';
import { createRequestSchema, type CreateRequestInput } from '@/features/requests/schemas';

/** Customer asks a provider for a quote. */
export async function createRequestAction(input: CreateRequestInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail('Je bent niet meer ingelogd. Log opnieuw in.');
  if (user.role !== 'CUSTOMER') return fail('Alleen klanten kunnen een offerte aanvragen.');

  const parsed = createRequestSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  const limit = await limitByIp(`request:${user.id}`, 20, 60 * 60_000);
  if (!limit.allowed) return fail(TOO_MANY_REQUESTS);

  try {
    const provider = await db.serviceProvider.findUnique({
      where: { id: data.providerId },
      select: { id: true, category: true, verified: true, is_active: true },
    });
    if (!provider || !provider.verified || !provider.is_active) {
      return fail('Deze dienstverlener neemt momenteel geen aanvragen aan.');
    }

    const eventDate = new Date(`${data.eventDate}T00:00:00.000Z`);
    const unavailable = await getUnavailableDates(provider.id, eventDate, eventDate);
    if (unavailable.includes(toDateKey(eventDate))) {
      const message = 'De dienstverlener is op deze datum niet beschikbaar. Kies een andere datum.';
      return fail(message, { eventDate: message });
    }

    await db.$transaction(async (tx) => {
      await tx.serviceRequest.create({
        data: {
          customer_id: user.id,
          provider_id: provider.id,
          category: provider.category,
          event_type: data.eventType,
          event_date: eventDate,
          event_location: data.eventLocation,
          guest_count: data.guestCount,
          budget_range: data.budgetRange || null,
          description: data.description ?? '',
          customer_name: data.customerName,
          customer_email: data.customerEmail,
          customer_phone: data.customerPhone,
          preferred_contact: data.preferredContact,
        },
      });
      if (data.slotId) {
        // Only touch a slot that belongs to this customer and is still open.
        await tx.eventSlot.updateMany({
          where: {
            id: data.slotId,
            status: { in: ['EMPTY', 'SEARCHING'] },
            event: { customer_id: user.id },
          },
          data: { status: 'QUOTES_REQUESTED' },
        });
      }
    });
  } catch (error) {
    console.error('[requests] create failed', error);
    return fail(GENERIC_ERROR);
  }

  revalidateApp();
  redirect('/dashboard/requests?verstuurd=1');
}
