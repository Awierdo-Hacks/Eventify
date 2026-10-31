import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';
import type { SessionUser } from '@/lib/auth';
import { isProviderAvailable, toDayKey } from '@/lib/availability';
import { categoryLabel } from '@/lib/categories';
import { formatEuro } from '@/lib/labels';

/**
 * All status transitions of the booking flow live here, so every route
 * enforces the same rules:
 *
 *   Request  PENDING → QUOTED → ACCEPTED        (decline → REJECTED, cancel → CANCELLED)
 *   Quote    open → accepted | rejected | expired (open = not accepted, not rejected, valid)
 *   Booking  CONFIRMED → COMPLETED | CANCELLED
 *   Slot     derived: EMPTY → QUOTES_REQUESTED → QUOTES_RECEIVED → BOOKED
 *   Event    PLANNING → ACTIVE (first booking) → COMPLETED (after the date) | CANCELLED
 */

type Tx = Prisma.TransactionClient;

export class WorkflowError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const OPEN_REQUEST_STATUSES = ['PENDING', 'QUOTED'] as const;

function startOfTodayUtc(): Date {
  return new Date(`${toDayKey(new Date())}T00:00:00.000Z`);
}

export function isQuoteExpired(quote: { valid_until: Date }): boolean {
  return quote.valid_until < startOfTodayUtc();
}

export function isQuoteOpen(quote: { accepted: boolean; rejected_at: Date | null; valid_until: Date }): boolean {
  return !quote.accepted && !quote.rejected_at && !isQuoteExpired(quote);
}

export function isRequestOpen(request: { status: string }): boolean {
  return (OPEN_REQUEST_STATUSES as readonly string[]).includes(request.status);
}

/** A provider may serve a slot of its own category; OTHER matches anything. */
export function categoriesMatch(providerCategory: string, slotCategory: string): boolean {
  return providerCategory === slotCategory || providerCategory === 'OTHER' || slotCategory === 'OTHER';
}

// ---------------------------------------------------------------------------
// Derived statuses
// ---------------------------------------------------------------------------

/** Recomputes a slot's status from its booking, quotes and open requests. */
export async function recomputeSlotStatus(tx: Tx, slotId: string): Promise<void> {
  const slot = await tx.eventSlot.findUnique({
    where: { id: slotId },
    select: {
      id: true,
      event_id: true,
      booked_quote_id: true,
      quotes: { select: { accepted: true, rejected_at: true, valid_until: true } },
      requests: { select: { status: true } },
    },
  });
  if (!slot) return;

  let status: 'EMPTY' | 'QUOTES_REQUESTED' | 'QUOTES_RECEIVED' | 'BOOKED' = 'EMPTY';
  if (slot.booked_quote_id) {
    status = 'BOOKED';
  } else if (slot.quotes.some((q) => isQuoteOpen(q))) {
    status = 'QUOTES_RECEIVED';
  } else if (slot.requests.some((r) => isRequestOpen(r))) {
    status = 'QUOTES_REQUESTED';
  }

  await tx.eventSlot.update({ where: { id: slot.id }, data: { status } });
  await recomputeEventStatus(tx, slot.event_id);
}

/** PLANNING ↔ ACTIVE depending on whether anything is booked. */
export async function recomputeEventStatus(tx: Tx, eventId: string): Promise<void> {
  const event = await tx.event.findUnique({
    where: { id: eventId },
    select: { status: true, slots: { select: { booked_quote_id: true } } },
  });
  if (!event || event.status === 'CANCELLED' || event.status === 'COMPLETED') return;

  const hasBooking = event.slots.some((s) => s.booked_quote_id);
  const status = hasBooking ? 'ACTIVE' : 'PLANNING';
  if (status !== event.status) {
    await tx.event.update({ where: { id: eventId }, data: { status } });
  }
}

// ---------------------------------------------------------------------------
// System messages in the chat
// ---------------------------------------------------------------------------

/**
 * Posts a SYSTEM message in the conversation between two users (creating the
 * conversation if needed), so status changes are visible in the chat.
 */
export async function postSystemMessage(
  tx: Tx,
  actorId: string,
  otherUserId: string,
  content: string
): Promise<void> {
  if (actorId === otherUserId) return;

  let conversation = await tx.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { user_id: actorId } } },
        { participants: { some: { user_id: otherUserId } } },
      ],
    },
    select: { id: true },
  });

  if (!conversation) {
    conversation = await tx.conversation.create({
      data: { participants: { create: [{ user_id: actorId }, { user_id: otherUserId }] } },
      select: { id: true },
    });
  }

  await tx.message.create({
    data: {
      conversation_id: conversation.id,
      sender_id: actorId,
      content,
      message_type: 'SYSTEM',
    },
  });
  await tx.conversation.update({ where: { id: conversation.id }, data: { updated_at: new Date() } });
}

function formatDay(date: Date): string {
  return date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// ---------------------------------------------------------------------------
// Slot linking
// ---------------------------------------------------------------------------

/**
 * Validates that a customer may attach a provider's request/quote to a slot.
 * Returns the slot when it is usable.
 */
export async function assertSlotUsable(
  tx: Tx | typeof prisma,
  params: { slotId: string; customerId: string; providerCategory: string; allowBookedByQuoteId?: string }
) {
  const slot = await tx.eventSlot.findUnique({
    where: { id: params.slotId },
    include: { event: { select: { customer_id: true, status: true } } },
  });

  if (!slot || slot.event.customer_id !== params.customerId) {
    throw new WorkflowError('Event-onderdeel niet gevonden', 404);
  }
  if (slot.event.status === 'CANCELLED' || slot.event.status === 'COMPLETED') {
    throw new WorkflowError('Dit event is afgesloten');
  }
  if (slot.booked_quote_id && slot.booked_quote_id !== params.allowBookedByQuoteId) {
    throw new WorkflowError('Voor dit onderdeel is al een provider geboekt');
  }
  if (!categoriesMatch(params.providerCategory, slot.category)) {
    throw new WorkflowError(
      `Deze provider biedt ${categoryLabel(params.providerCategory)} aan en past niet bij het onderdeel ${categoryLabel(slot.category)}`
    );
  }
  return slot;
}

// ---------------------------------------------------------------------------
// Quotes
// ---------------------------------------------------------------------------

export async function acceptQuote(params: { quoteId: string; customer: SessionUser; eventSlotId?: string | null }) {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findUnique({
      where: { id: params.quoteId },
      include: {
        request: true,
        provider: { select: { id: true, user_id: true, business_name: true, category: true } },
      },
    });

    if (!quote || quote.request.customer_id !== params.customer.id) {
      throw new WorkflowError('Offerte niet gevonden', 404);
    }

    const existingBooking = await tx.booking.findUnique({ where: { request_id: quote.request_id } });

    // Idempotent: accepting the same quote twice returns the existing booking
    if (quote.accepted && existingBooking && existingBooking.status !== 'CANCELLED') {
      return { quote, booking: existingBooking, alreadyAccepted: true };
    }
    if (quote.rejected_at) throw new WorkflowError('Deze offerte is al afgewezen');
    if (quote.accepted) throw new WorkflowError('Deze offerte is al geaccepteerd');
    if (isQuoteExpired(quote)) {
      throw new WorkflowError('Deze offerte is verlopen. Vraag de provider om een nieuwe offerte.');
    }
    if (!isRequestOpen(quote.request)) {
      throw new WorkflowError('Deze aanvraag is afgesloten en kan niet meer geboekt worden');
    }
    if (existingBooking) {
      throw new WorkflowError('Er is al een boeking voor deze aanvraag');
    }
    if (quote.request.event_date < startOfTodayUtc()) {
      throw new WorkflowError('De datum van dit event ligt in het verleden');
    }

    const available = await isProviderAvailable(quote.provider_id, quote.request.event_date, {}, tx);
    if (!available) {
      throw new WorkflowError(
        `${quote.provider.business_name} is niet meer beschikbaar op ${formatDay(quote.request.event_date)}`,
        409
      );
    }

    // Slot: explicit choice, otherwise the quote's or request's own slot
    const slotId = params.eventSlotId || quote.event_slot_id || quote.request.event_slot_id;
    if (slotId) {
      await assertSlotUsable(tx, {
        slotId,
        customerId: params.customer.id,
        providerCategory: quote.provider.category,
      });
    }

    const updatedQuote = await tx.quote.update({
      where: { id: quote.id },
      data: { accepted: true, ...(slotId ? { event_slot_id: slotId } : {}) },
    });

    // Other open quotes on the same request are closed automatically
    await tx.quote.updateMany({
      where: { request_id: quote.request_id, id: { not: quote.id }, accepted: false, rejected_at: null },
      data: { rejected_at: new Date(), rejection_reason: 'Klant koos een andere offerte' },
    });

    const booking = await tx.booking.create({
      data: {
        request_id: quote.request_id,
        customer_id: quote.request.customer_id,
        provider_id: quote.provider_id,
        event_date: quote.request.event_date,
        event_location: quote.request.event_location,
        guest_count: quote.request.guest_count,
        final_price: quote.total_price,
        status: 'CONFIRMED',
        payment_status: 'UNPAID',
      },
    });

    await tx.serviceRequest.update({
      where: { id: quote.request_id },
      data: { status: 'ACCEPTED', ...(slotId ? { event_slot_id: slotId } : {}) },
    });

    if (slotId) {
      await tx.eventSlot.update({ where: { id: slotId }, data: { booked_quote_id: quote.id } });
      await recomputeSlotStatus(tx, slotId);
    }

    await postSystemMessage(
      tx,
      params.customer.id,
      quote.provider.user_id,
      `✅ Offerte van ${formatEuro(quote.total_price)} geaccepteerd. De boeking voor ${formatDay(quote.request.event_date)} is bevestigd.`
    );

    return { quote: updatedQuote, booking, alreadyAccepted: false };
  });
}

export async function rejectQuote(params: { quoteId: string; customer: SessionUser; reason?: string | null }) {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findUnique({
      where: { id: params.quoteId },
      include: { request: { select: { customer_id: true } }, provider: { select: { user_id: true } } },
    });

    if (!quote || quote.request.customer_id !== params.customer.id) {
      throw new WorkflowError('Offerte niet gevonden', 404);
    }
    if (quote.accepted) {
      throw new WorkflowError('Een geaccepteerde offerte kan niet meer afgewezen worden. Annuleer de boeking.');
    }
    if (quote.rejected_at) {
      return quote;
    }

    const updated = await tx.quote.update({
      where: { id: quote.id },
      data: { rejected_at: new Date(), rejection_reason: params.reason?.trim().slice(0, 500) || null },
    });

    if (quote.event_slot_id) await recomputeSlotStatus(tx, quote.event_slot_id);

    await postSystemMessage(
      tx,
      params.customer.id,
      quote.provider.user_id,
      `Offerte afgewezen${params.reason?.trim() ? `: ${params.reason.trim().slice(0, 500)}` : '.'}`
    );

    return updated;
  });
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

/** Provider declines a request ("niet beschikbaar") or customer cancels it. */
export async function closeRequest(params: {
  requestId: string;
  actor: SessionUser;
  action: 'decline' | 'cancel';
  reason?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.serviceRequest.findUnique({
      where: { id: params.requestId },
      include: { provider: { select: { id: true, user_id: true, business_name: true } } },
    });
    if (!request) throw new WorkflowError('Aanvraag niet gevonden', 404);

    const isProvider = !!params.actor.providerId && request.provider_id === params.actor.providerId;
    const isCustomer = request.customer_id === params.actor.id;

    if (params.action === 'decline' && !isProvider) throw new WorkflowError('Aanvraag niet gevonden', 404);
    if (params.action === 'cancel' && !isCustomer) throw new WorkflowError('Aanvraag niet gevonden', 404);
    if (!isRequestOpen(request)) {
      throw new WorkflowError(
        request.status === 'ACCEPTED'
          ? 'Deze aanvraag is al geboekt. Annuleer de boeking in plaats daarvan.'
          : 'Deze aanvraag is al afgesloten'
      );
    }

    const reason = params.reason?.trim().slice(0, 500) || null;
    const updated = await tx.serviceRequest.update({
      where: { id: request.id },
      data: {
        status: params.action === 'decline' ? 'REJECTED' : 'CANCELLED',
        decline_reason: reason,
        closed_at: new Date(),
      },
    });

    // Open quotes on a closed request can no longer be accepted
    await tx.quote.updateMany({
      where: { request_id: request.id, accepted: false, rejected_at: null },
      data: {
        rejected_at: new Date(),
        rejection_reason: params.action === 'decline' ? 'Provider heeft de aanvraag afgewezen' : 'Klant heeft de aanvraag geannuleerd',
      },
    });

    if (request.event_slot_id) await recomputeSlotStatus(tx, request.event_slot_id);

    if (request.provider) {
      const message =
        params.action === 'decline'
          ? `${request.provider.business_name} is helaas niet beschikbaar voor deze aanvraag${reason ? `: ${reason}` : '.'}`
          : `De klant heeft de aanvraag voor ${formatDay(request.event_date)} geannuleerd${reason ? `: ${reason}` : '.'}`;
      const [from, to] =
        params.action === 'decline'
          ? [request.provider.user_id, request.customer_id]
          : [request.customer_id, request.provider.user_id];
      await postSystemMessage(tx, from, to, message);
    }

    return updated;
  });
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

async function loadBookingForActor(tx: Tx, bookingId: string, actor: SessionUser) {
  const booking = await tx.booking.findUnique({
    where: { id: bookingId },
    include: {
      provider: { select: { id: true, user_id: true, business_name: true } },
      request: { select: { id: true, event_slot_id: true } },
    },
  });
  if (!booking) throw new WorkflowError('Boeking niet gevonden', 404);

  const isCustomer = booking.customer_id === actor.id;
  const isProvider = !!actor.providerId && booking.provider_id === actor.providerId;
  const isAdmin = actor.role === 'ADMIN';
  if (!isCustomer && !isProvider && !isAdmin) throw new WorkflowError('Boeking niet gevonden', 404);

  return { booking, isCustomer, isProvider, isAdmin };
}

/** Provider (or admin) marks a booking as completed, from the event day on. */
export async function completeBooking(params: { bookingId: string; actor: SessionUser }) {
  return prisma.$transaction(async (tx) => {
    const { booking, isProvider, isAdmin } = await loadBookingForActor(tx, params.bookingId, params.actor);

    if (!isProvider && !isAdmin) throw new WorkflowError('Alleen de provider kan een boeking voltooien', 403);
    if (booking.status === 'COMPLETED') return booking;
    if (booking.status !== 'CONFIRMED') throw new WorkflowError('Alleen bevestigde boekingen kunnen voltooid worden');
    if (toDayKey(booking.event_date) > toDayKey(new Date())) {
      throw new WorkflowError('Je kunt een boeking pas voltooien op of na de dag van het event');
    }

    const updated = await tx.booking.update({
      where: { id: booking.id },
      data: { status: 'COMPLETED', completed_at: new Date() },
    });

    await postSystemMessage(
      tx,
      booking.provider.user_id,
      booking.customer_id,
      `🎉 De boeking van ${formatDay(booking.event_date)} is voltooid. Laat je een review achter voor ${booking.provider.business_name}?`
    );

    return updated;
  });
}

/** Customer, provider or admin cancels a confirmed booking. */
export async function cancelBooking(params: { bookingId: string; actor: SessionUser; reason: string }) {
  const reason = params.reason.trim().slice(0, 500);
  if (reason.length < 3) throw new WorkflowError('Geef een reden voor de annulering');

  return prisma.$transaction(async (tx) => {
    const { booking, isCustomer } = await loadBookingForActor(tx, params.bookingId, params.actor);

    if (booking.status === 'CANCELLED') return booking;
    if (booking.status === 'COMPLETED') throw new WorkflowError('Een voltooide boeking kan niet geannuleerd worden');
    if (booking.payment_status === 'PAID' || booking.payment_status === 'PENDING') {
      throw new WorkflowError(
        'Voor deze boeking is (een deel) betaald. Neem contact op met Eventiphy om te annuleren, zodat de terugbetaling geregeld wordt.',
        409
      );
    }

    const updated = await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: 'CANCELLED',
        cancelled_at: new Date(),
        cancelled_by_id: params.actor.id,
        cancellation_reason: reason,
      },
    });

    await tx.serviceRequest.update({
      where: { id: booking.request_id },
      data: { status: 'CANCELLED', closed_at: new Date() },
    });

    // Free the slot so the customer can book someone else
    const bookedSlots = await tx.eventSlot.findMany({
      where: { booked_quote: { request_id: booking.request_id } },
      select: { id: true },
    });
    for (const slot of bookedSlots) {
      await tx.eventSlot.update({ where: { id: slot.id }, data: { booked_quote_id: null } });
      await recomputeSlotStatus(tx, slot.id);
    }

    const [from, to] = isCustomer
      ? [booking.customer_id, booking.provider.user_id]
      : [booking.provider.user_id, booking.customer_id];
    await postSystemMessage(tx, from, to, `❌ De boeking van ${formatDay(booking.event_date)} is geannuleerd: ${reason}`);

    return updated;
  });
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/**
 * Cancels an event and everything attached to it: open requests are
 * cancelled, confirmed bookings cancelled (unless paid) and every affected
 * provider gets a chat message.
 */
export async function cancelEvent(params: { eventId: string; customer: SessionUser }) {
  return prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({
      where: { id: params.eventId },
      include: {
        slots: {
          select: {
            id: true,
            category: true,
            requests: {
              where: { status: { in: ['PENDING', 'QUOTED', 'ACCEPTED'] } },
              select: {
                id: true,
                status: true,
                provider: { select: { user_id: true } },
                booking: { select: { id: true, status: true, payment_status: true } },
              },
            },
          },
        },
      },
    });

    if (!event || event.customer_id !== params.customer.id) throw new WorkflowError('Event niet gevonden', 404);
    if (event.status === 'CANCELLED') return event;

    const paidBooking = event.slots
      .flatMap((s) => s.requests)
      .find((r) => r.booking && r.booking.status === 'CONFIRMED' && ['PAID', 'PENDING'].includes(r.booking.payment_status));
    if (paidBooking) {
      throw new WorkflowError(
        'Er is al (deels) betaald voor een boeking van dit event. Neem contact op met Eventiphy om te annuleren.',
        409
      );
    }

    const now = new Date();
    const notified = new Set<string>();

    for (const slot of event.slots) {
      for (const request of slot.requests) {
        await tx.serviceRequest.update({
          where: { id: request.id },
          data: { status: 'CANCELLED', closed_at: now },
        });
        await tx.quote.updateMany({
          where: { request_id: request.id, accepted: false, rejected_at: null },
          data: { rejected_at: now, rejection_reason: 'Klant heeft het event geannuleerd' },
        });
        if (request.booking && request.booking.status === 'CONFIRMED') {
          await tx.booking.update({
            where: { id: request.booking.id },
            data: {
              status: 'CANCELLED',
              cancelled_at: now,
              cancelled_by_id: params.customer.id,
              cancellation_reason: 'Event geannuleerd door de klant',
            },
          });
        }
        const providerUserId = request.provider?.user_id;
        if (providerUserId && !notified.has(providerUserId)) {
          notified.add(providerUserId);
          await postSystemMessage(
            tx,
            params.customer.id,
            providerUserId,
            `❌ Het event "${event.name}"${event.event_date ? ` van ${formatDay(event.event_date)}` : ''} is geannuleerd door de klant.`
          );
        }
      }
      await tx.eventSlot.update({ where: { id: slot.id }, data: { booked_quote_id: null, status: 'EMPTY' } });
    }

    return tx.event.update({ where: { id: event.id }, data: { status: 'CANCELLED' } });
  });
}

/** Maps WorkflowError to a JSON response body + status for API routes. */
export function workflowErrorResponse(error: unknown): { body: { error: string }; status: number } | null {
  if (error instanceof WorkflowError) {
    return { body: { error: error.message }, status: error.status };
  }
  return null;
}
