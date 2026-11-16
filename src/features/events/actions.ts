'use server';

import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { fail, invalid, ok, GENERIC_ERROR, type ActionResult } from '@/lib/action';
import { revalidateApp } from '@/lib/revalidate';
import { getCurrentUser } from '@/lib/session';
import {
  addSlotSchema,
  createEventSchema,
  eventDetailsSchema,
  type AddSlotInput,
  type CreateEventInput,
  type EventDetailsInput,
} from '@/features/events/schemas';

const NOT_ALLOWED = 'Alleen klanten kunnen events beheren.';

async function customer() {
  const user = await getCurrentUser();
  return user?.role === 'CUSTOMER' ? user : null;
}

async function ownEvent(eventId: string, userId: string) {
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { id: true, customer_id: true, status: true },
  });
  return event && event.customer_id === userId && event.status !== 'CANCELLED' ? event : null;
}

export async function createEventAction(input: CreateEventInput): Promise<ActionResult> {
  const user = await customer();
  if (!user) return fail(NOT_ALLOWED);
  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  let eventId: string;
  try {
    const event = await db.event.create({
      data: {
        customer_id: user.id,
        name: data.name,
        event_type: data.eventType,
        event_date: data.eventDate ? new Date(data.eventDate) : null,
        location: data.location || null,
        guest_count: data.guestCount,
        budget_min: data.budgetMin,
        budget_max: data.budgetMax,
        slots: {
          create: data.slots.map((slot, index) => ({
            category: slot.category,
            custom_name: slot.customName || null,
            is_required: slot.isRequired,
            display_order: index,
          })),
        },
      },
      select: { id: true },
    });
    eventId = event.id;
  } catch (error) {
    console.error('[events] create failed', error);
    return fail(GENERIC_ERROR);
  }

  revalidateApp();
  redirect(`/dashboard/events/${eventId}`);
}

export async function updateEventAction(
  input: EventDetailsInput & { eventId: string }
): Promise<ActionResult> {
  const user = await customer();
  if (!user) return fail(NOT_ALLOWED);
  const parsed = eventDetailsSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  try {
    if (!(await ownEvent(input.eventId, user.id))) return fail('Dit event bestaat niet (meer).');
    await db.event.update({
      where: { id: input.eventId },
      data: {
        name: data.name,
        event_date: data.eventDate ? new Date(data.eventDate) : null,
        location: data.location || null,
        guest_count: data.guestCount,
        budget_min: data.budgetMin,
        budget_max: data.budgetMax,
      },
    });
  } catch (error) {
    console.error('[events] update failed', error);
    return fail(GENERIC_ERROR);
  }

  revalidateApp();
  return ok(undefined, 'Event bijgewerkt.');
}

/** Events are never hard-deleted: they are marked cancelled and their quotes are released. */
export async function cancelEventAction(input: { eventId: string }): Promise<ActionResult> {
  const user = await customer();
  if (!user) return fail(NOT_ALLOWED);

  try {
    if (!(await ownEvent(input.eventId, user.id))) return fail('Dit event bestaat niet (meer).');
    await db.$transaction([
      db.eventSlot.updateMany({
        where: { event_id: input.eventId },
        data: { booked_quote_id: null },
      }),
      db.quote.updateMany({
        where: { event_slot: { event_id: input.eventId } },
        data: { event_slot_id: null },
      }),
      db.event.update({ where: { id: input.eventId }, data: { status: 'CANCELLED' } }),
    ]);
  } catch (error) {
    console.error('[events] cancel failed', error);
    return fail(GENERIC_ERROR);
  }

  revalidateApp();
  redirect('/dashboard/events');
}

export async function addSlotAction(input: AddSlotInput): Promise<ActionResult> {
  const user = await customer();
  if (!user) return fail(NOT_ALLOWED);
  const parsed = addSlotSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  try {
    if (!(await ownEvent(data.eventId, user.id))) return fail('Dit event bestaat niet (meer).');
    const last = await db.eventSlot.findFirst({
      where: { event_id: data.eventId },
      orderBy: { display_order: 'desc' },
      select: { display_order: true },
    });
    await db.eventSlot.create({
      data: {
        event_id: data.eventId,
        category: data.category,
        custom_name: data.customName || null,
        is_required: data.isRequired,
        display_order: (last?.display_order ?? -1) + 1,
      },
    });
  } catch (error) {
    console.error('[events] add slot failed', error);
    return fail(GENERIC_ERROR);
  }

  revalidateApp();
  return ok(undefined, 'Onderdeel toegevoegd.');
}

export async function removeSlotAction(input: {
  eventId: string;
  slotId: string;
}): Promise<ActionResult> {
  const user = await customer();
  if (!user) return fail(NOT_ALLOWED);

  try {
    if (!(await ownEvent(input.eventId, user.id))) return fail('Dit event bestaat niet (meer).');
    const slot = await db.eventSlot.findFirst({
      where: { id: input.slotId, event_id: input.eventId },
      select: { id: true, booked_quote_id: true },
    });
    if (!slot) return fail('Dit onderdeel bestaat niet (meer).');
    if (slot.booked_quote_id) {
      return fail(
        'Voor dit onderdeel ligt al een dienstverlener vast. Koppel de offerte eerst los.'
      );
    }
    await db.$transaction([
      db.quote.updateMany({ where: { event_slot_id: slot.id }, data: { event_slot_id: null } }),
      db.eventSlot.delete({ where: { id: slot.id } }),
    ]);
  } catch (error) {
    console.error('[events] remove slot failed', error);
    return fail(GENERIC_ERROR);
  }

  revalidateApp();
  return ok(undefined, 'Onderdeel verwijderd.');
}
