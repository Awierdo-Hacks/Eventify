'use server';

import { db } from '@/lib/db';
import { fail, invalid, ok, GENERIC_ERROR, type ActionResult } from '@/lib/action';
import { revalidateApp } from '@/lib/revalidate';
import { getCurrentUser } from '@/lib/session';
import { createQuoteSchema, DEFAULT_TERMS, type CreateQuoteInput } from '@/features/quotes/schemas';

const NOT_SIGNED_IN = 'Je bent niet meer ingelogd. Log opnieuw in.';
const DAY_MS = 24 * 60 * 60 * 1000;

class QuoteError extends Error {}

/**
 * Customer accepts a quote. One transaction creates the booking, marks the
 * request as accepted and (when the quote belongs to an event slot) books the
 * slot — so a half-accepted quote can never exist. `bookings.request_id` is
 * unique, which also makes a double click or two tabs safe.
 */
export async function acceptQuoteAction(input: { quoteId: string; slotId?: string | null }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail(NOT_SIGNED_IN);
  if (user.role !== 'CUSTOMER') return fail('Alleen klanten kunnen een offerte accepteren.');

  try {
    await db.$transaction(async (tx) => {
      const quote = await tx.quote.findUnique({
        where: { id: input.quoteId },
        include: { request: true },
      });
      if (!quote || quote.request.customer_id !== user.id) throw new QuoteError('Deze offerte bestaat niet (meer).');
      if (quote.accepted) throw new QuoteError('Je hebt deze offerte al geaccepteerd.');
      if (quote.rejected_at) throw new QuoteError('Deze offerte is afgewezen en kan niet meer geaccepteerd worden.');
      if (quote.valid_until.getTime() < Date.now()) {
        throw new QuoteError('Deze offerte is verlopen. Vraag de dienstverlener om een nieuwe offerte.');
      }

      const existingBooking = await tx.booking.findUnique({ where: { request_id: quote.request_id }, select: { id: true } });
      if (existingBooking) throw new QuoteError('Voor deze aanvraag is al een offerte geaccepteerd.');

      const slotId = input.slotId ?? quote.event_slot_id;
      if (slotId) {
        const slot = await tx.eventSlot.findUnique({
          where: { id: slotId },
          select: { booked_quote_id: true, event: { select: { customer_id: true, status: true } } },
        });
        if (!slot || slot.event.customer_id !== user.id || slot.event.status === 'CANCELLED') {
          throw new QuoteError('Dit onderdeel van je event bestaat niet (meer).');
        }
        if (slot.booked_quote_id && slot.booked_quote_id !== quote.id) {
          throw new QuoteError('Voor dit onderdeel is al een andere dienstverlener vastgelegd.');
        }
      }

      await tx.quote.update({
        where: { id: quote.id },
        data: { accepted: true, ...(slotId ? { event_slot_id: slotId } : {}) },
      });
      await tx.booking.create({
        data: {
          request_id: quote.request_id,
          customer_id: user.id,
          provider_id: quote.provider_id,
          event_date: quote.request.event_date,
          event_location: quote.request.event_location,
          guest_count: quote.request.guest_count,
          final_price: quote.total_price,
          status: 'CONFIRMED',
          payment_status: 'UNPAID',
        },
      });
      await tx.serviceRequest.update({ where: { id: quote.request_id }, data: { status: 'ACCEPTED' } });
      if (slotId) {
        await tx.eventSlot.update({ where: { id: slotId }, data: { status: 'BOOKED', booked_quote_id: quote.id } });
      }
    });
  } catch (error) {
    if (error instanceof QuoteError) return fail(error.message);
    console.error('[quotes] accept failed', error);
    return fail(GENERIC_ERROR);
  }

  revalidateApp();
  return ok(undefined, 'Offerte geaccepteerd. De afspraak ligt vast.');
}

export async function rejectQuoteAction(input: { quoteId: string; reason?: string }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail(NOT_SIGNED_IN);

  try {
    const quote = await db.quote.findUnique({
      where: { id: input.quoteId },
      select: { id: true, accepted: true, rejected_at: true, event_slot_id: true, request: { select: { customer_id: true } } },
    });
    if (!quote || quote.request.customer_id !== user.id) return fail('Deze offerte bestaat niet (meer).');
    if (quote.accepted) return fail('Een geaccepteerde offerte kun je niet meer afwijzen.');
    if (quote.rejected_at) return ok();

    await db.$transaction(async (tx) => {
      await tx.quote.update({
        where: { id: quote.id },
        data: { rejected_at: new Date(), rejection_reason: input.reason?.trim().slice(0, 500) || null, event_slot_id: null },
      });
      if (quote.event_slot_id) await refreshSlotStatus(tx, quote.event_slot_id);
    });
  } catch (error) {
    console.error('[quotes] reject failed', error);
    return fail(GENERIC_ERROR);
  }

  revalidateApp();
  return ok(undefined, 'Offerte afgewezen.');
}

type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];

/** After quotes are added to or removed from a slot, bring its status in line. */
async function refreshSlotStatus(tx: Tx, slotId: string) {
  const slot = await tx.eventSlot.findUnique({ where: { id: slotId }, select: { status: true, booked_quote_id: true } });
  if (!slot || slot.booked_quote_id) return;
  const remaining = await tx.quote.count({ where: { event_slot_id: slotId, rejected_at: null } });
  const next = remaining > 0 ? 'QUOTES_RECEIVED' : slot.status === 'QUOTES_RECEIVED' ? 'EMPTY' : slot.status;
  if (next !== slot.status) await tx.eventSlot.update({ where: { id: slotId }, data: { status: next } });
}

/** Attach one of the customer's quotes to a slot of one of their events. */
export async function linkQuoteAction(input: { quoteId: string; slotId: string }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail(NOT_SIGNED_IN);

  try {
    const [quote, slot] = await Promise.all([
      db.quote.findUnique({
        where: { id: input.quoteId },
        select: { id: true, accepted: true, rejected_at: true, event_slot_id: true, request: { select: { customer_id: true } } },
      }),
      db.eventSlot.findUnique({
        where: { id: input.slotId },
        select: { id: true, booked_quote_id: true, event: { select: { customer_id: true, status: true } } },
      }),
    ]);
    if (!quote || quote.request.customer_id !== user.id) return fail('Deze offerte bestaat niet (meer).');
    if (!slot || slot.event.customer_id !== user.id || slot.event.status === 'CANCELLED') {
      return fail('Dit onderdeel van je event bestaat niet (meer).');
    }
    if (quote.rejected_at) return fail('Een afgewezen offerte kun je niet koppelen.');
    if (slot.booked_quote_id && slot.booked_quote_id !== quote.id) {
      return fail('Voor dit onderdeel is al een dienstverlener vastgelegd.');
    }

    await db.$transaction(async (tx) => {
      const previousSlotId = quote.event_slot_id;
      await tx.quote.update({ where: { id: quote.id }, data: { event_slot_id: slot.id } });
      if (quote.accepted) {
        if (previousSlotId && previousSlotId !== slot.id) {
          await tx.eventSlot.update({ where: { id: previousSlotId }, data: { booked_quote_id: null, status: 'EMPTY' } });
        }
        await tx.eventSlot.update({ where: { id: slot.id }, data: { status: 'BOOKED', booked_quote_id: quote.id } });
      } else {
        await refreshSlotStatus(tx, slot.id);
      }
      if (previousSlotId && previousSlotId !== slot.id) await refreshSlotStatus(tx, previousSlotId);
    });
  } catch (error) {
    console.error('[quotes] link failed', error);
    return fail(GENERIC_ERROR);
  }

  revalidateApp();
  return ok(undefined, 'Offerte gekoppeld aan je event.');
}

export async function unlinkQuoteAction(input: { quoteId: string }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail(NOT_SIGNED_IN);

  try {
    const quote = await db.quote.findUnique({
      where: { id: input.quoteId },
      select: { id: true, accepted: true, event_slot_id: true, request: { select: { customer_id: true } } },
    });
    if (!quote || quote.request.customer_id !== user.id) return fail('Deze offerte bestaat niet (meer).');
    const slotId = quote.event_slot_id;
    if (!slotId) return ok();

    await db.$transaction(async (tx) => {
      await tx.quote.update({ where: { id: quote.id }, data: { event_slot_id: null } });
      if (quote.accepted) {
        await tx.eventSlot.update({ where: { id: slotId }, data: { booked_quote_id: null, status: 'EMPTY' } });
      }
      await refreshSlotStatus(tx, slotId);
    });
  } catch (error) {
    console.error('[quotes] unlink failed', error);
    return fail(GENERIC_ERROR);
  }

  revalidateApp();
  return ok(undefined, 'Offerte losgekoppeld.');
}

/** Provider answers a request with a quote. */
export async function createQuoteAction(input: CreateQuoteInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail(NOT_SIGNED_IN);
  if (user.role !== 'PROVIDER' || !user.providerId) return fail('Alleen dienstverleners kunnen offertes versturen.');

  const parsed = createQuoteSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;
  const providerId = user.providerId;

  try {
    const request = await db.serviceRequest.findUnique({
      where: { id: data.requestId },
      select: { id: true, provider_id: true, status: true },
    });
    if (!request || request.provider_id !== providerId) return fail('Deze aanvraag bestaat niet (meer).');
    if (request.status === 'ACCEPTED' || request.status === 'CANCELLED') {
      return fail('Voor deze aanvraag kun je geen offerte meer versturen.');
    }

    await db.$transaction(async (tx) => {
      const existing = await tx.quote.findFirst({
        where: { request_id: request.id, provider_id: providerId },
        select: { id: true, rejected_at: true },
      });
      if (existing && !existing.rejected_at) throw new QuoteError('Je hebt voor deze aanvraag al een offerte verstuurd.');
      // A rejected quote makes room for a new one (same behaviour as v1).
      if (existing) await tx.quote.delete({ where: { id: existing.id } });

      await tx.quote.create({
        data: {
          request_id: request.id,
          provider_id: providerId,
          total_price: data.totalPrice,
          message: data.title,
          terms: data.terms || DEFAULT_TERMS,
          included_services: data.includedServices,
          valid_until: new Date(Date.now() + data.validDays * DAY_MS),
        },
      });
      await tx.serviceRequest.update({ where: { id: request.id }, data: { status: 'QUOTED' } });
    });
  } catch (error) {
    if (error instanceof QuoteError) return fail(error.message);
    console.error('[quotes] create failed', error);
    return fail(GENERIC_ERROR);
  }

  revalidateApp();
  return ok(undefined, 'Offerte verstuurd.');
}

/** Provider removes a quote the customer rejected. */
export async function withdrawQuoteAction(input: { quoteId: string }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail(NOT_SIGNED_IN);
  if (user.role !== 'PROVIDER' || !user.providerId) return fail('Alleen dienstverleners kunnen offertes verwijderen.');

  try {
    const quote = await db.quote.findUnique({
      where: { id: input.quoteId },
      select: { id: true, provider_id: true, rejected_at: true },
    });
    if (!quote || quote.provider_id !== user.providerId) return fail('Deze offerte bestaat niet (meer).');
    if (!quote.rejected_at) return fail('Alleen afgewezen offertes kun je verwijderen.');
    await db.quote.delete({ where: { id: quote.id } });
  } catch (error) {
    console.error('[quotes] withdraw failed', error);
    return fail(GENERIC_ERROR);
  }

  revalidateApp();
  return ok(undefined, 'Offerte verwijderd.');
}
