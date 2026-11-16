import 'server-only';
import { db } from '@/lib/db';
import { quoteStatus } from '@/lib/catalog';
import type { Prisma } from '@/generated/prisma/client';

const quoteSelect = {
  id: true,
  total_price: true,
  message: true,
  terms: true,
  included_services: true,
  valid_until: true,
  accepted: true,
  rejected_at: true,
  rejection_reason: true,
  event_slot_id: true,
  created_at: true,
  provider: {
    select: {
      id: true,
      user_id: true,
      business_name: true,
      category: true,
      location: true,
      images: true,
    },
  },
  request: {
    select: {
      id: true,
      event_type: true,
      event_date: true,
      event_location: true,
      guest_count: true,
      category: true,
      customer: { select: { id: true, name: true } },
    },
  },
  event_slot: { select: { id: true, event: { select: { id: true, name: true } } } },
} satisfies Prisma.QuoteSelect;

type QuoteRow = Prisma.QuoteGetPayload<{ select: typeof quoteSelect }>;

/** Plain, serialisable quote for cards and client components. */
export interface QuoteView {
  id: string;
  price: number;
  title: string;
  terms: string | null;
  includedServices: string[];
  validUntil: string;
  status: ReturnType<typeof quoteStatus>;
  rejectionReason: string | null;
  createdAt: string;
  slotId: string | null;
  linkedEvent: { id: string; name: string } | null;
  provider: {
    id: string;
    userId: string;
    name: string;
    category: string;
    location: string;
    image: string | null;
  };
  request: {
    id: string;
    eventType: string;
    eventDate: string;
    eventLocation: string;
    guestCount: number;
    category: string;
    customer: { id: string; name: string };
  };
}

export function toQuoteView(row: QuoteRow): QuoteView {
  return {
    id: row.id,
    price: row.total_price,
    title: row.message || 'Offerte',
    terms: row.terms,
    includedServices: row.included_services,
    validUntil: row.valid_until.toISOString(),
    status: quoteStatus(row),
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at.toISOString(),
    slotId: row.event_slot_id,
    linkedEvent: row.event_slot
      ? { id: row.event_slot.event.id, name: row.event_slot.event.name }
      : null,
    provider: {
      id: row.provider.id,
      userId: row.provider.user_id,
      name: row.provider.business_name,
      category: row.provider.category,
      location: row.provider.location,
      image: row.provider.images[0] ?? null,
    },
    request: {
      id: row.request.id,
      eventType: row.request.event_type,
      eventDate: row.request.event_date.toISOString(),
      eventLocation: row.request.event_location,
      guestCount: row.request.guest_count,
      category: row.request.category,
      customer: row.request.customer,
    },
  };
}

export { quoteSelect };

/** Quotes a customer can still act on or has accepted (rejected ones are hidden, as in v1). */
export async function getCustomerQuotes(customerId: string): Promise<QuoteView[]> {
  const rows = await db.quote.findMany({
    where: { request: { customer_id: customerId }, rejected_at: null },
    select: quoteSelect,
    orderBy: { created_at: 'desc' },
    take: 200,
  });
  return rows.map(toQuoteView);
}

export async function getProviderQuotes(providerId: string): Promise<QuoteView[]> {
  const rows = await db.quote.findMany({
    where: { provider_id: providerId },
    select: quoteSelect,
    orderBy: { created_at: 'desc' },
    take: 200,
  });
  return rows.map(toQuoteView);
}

/** Slots of the customer's active events that a quote can be attached to. */
export async function getLinkableSlots(customerId: string) {
  const events = await db.event.findMany({
    where: { customer_id: customerId, status: { in: ['PLANNING', 'ACTIVE'] } },
    select: {
      id: true,
      name: true,
      slots: {
        where: { booked_quote_id: null },
        select: { id: true, category: true, custom_name: true },
        orderBy: { display_order: 'asc' },
      },
    },
    orderBy: { created_at: 'desc' },
  });
  return events
    .filter((event) => event.slots.length > 0)
    .map((event) => ({
      id: event.id,
      name: event.name,
      slots: event.slots.map((slot) => ({
        id: slot.id,
        category: slot.category as string,
        customName: slot.custom_name,
      })),
    }));
}

export type LinkableEvent = Awaited<ReturnType<typeof getLinkableSlots>>[number];
