import 'server-only';
import { db } from '@/lib/db';
import { quoteSelect, toQuoteView } from '@/features/quotes/queries';

/** Share of slots that have at least one quote or are booked. */
export function eventProgress(slots: Array<{ status: string }>) {
  const total = slots.length;
  const booked = slots.filter((slot) => slot.status === 'BOOKED').length;
  const withQuotes = slots.filter((slot) => slot.status === 'QUOTES_RECEIVED').length;
  return {
    total,
    booked,
    withQuotes,
    percent: total === 0 ? 0 : Math.round((booked / total) * 100),
  };
}

export async function getCustomerEvents(customerId: string) {
  const events = await db.event.findMany({
    where: { customer_id: customerId, status: { not: 'CANCELLED' } },
    select: {
      id: true,
      name: true,
      event_type: true,
      event_date: true,
      location: true,
      guest_count: true,
      status: true,
      slots: { select: { status: true, category: true }, orderBy: { display_order: 'asc' } },
    },
    orderBy: [{ event_date: { sort: 'asc', nulls: 'last' } }, { created_at: 'desc' }],
  });
  return events;
}

export type CustomerEvent = Awaited<ReturnType<typeof getCustomerEvents>>[number];

export async function getCustomerEvent(customerId: string, eventId: string) {
  const event = await db.event.findFirst({
    where: { id: eventId, customer_id: customerId, status: { not: 'CANCELLED' } },
    select: {
      id: true,
      name: true,
      event_type: true,
      event_date: true,
      location: true,
      guest_count: true,
      budget_min: true,
      budget_max: true,
      status: true,
      slots: {
        select: {
          id: true,
          category: true,
          custom_name: true,
          is_required: true,
          status: true,
          booked_quote_id: true,
          quotes: {
            where: { rejected_at: null },
            select: quoteSelect,
            orderBy: { created_at: 'desc' },
          },
        },
        orderBy: { display_order: 'asc' },
      },
    },
  });
  if (!event) return null;

  return {
    ...event,
    slots: event.slots.map((slot) => ({
      id: slot.id,
      category: slot.category as string,
      customName: slot.custom_name,
      isRequired: slot.is_required,
      status: slot.status as string,
      bookedQuoteId: slot.booked_quote_id,
      quotes: slot.quotes.map(toQuoteView),
    })),
  };
}

export type CustomerEventDetail = NonNullable<Awaited<ReturnType<typeof getCustomerEvent>>>;
