import 'server-only';
import { db } from '@/lib/db';
import { quoteSelect, toQuoteView } from '@/features/quotes/queries';

export async function getCustomerRequests(customerId: string) {
  const rows = await db.serviceRequest.findMany({
    where: { customer_id: customerId },
    select: {
      id: true,
      category: true,
      event_type: true,
      event_date: true,
      event_location: true,
      guest_count: true,
      status: true,
      created_at: true,
      provider: { select: { id: true, user_id: true, business_name: true, category: true } },
      quotes: { where: { rejected_at: null }, select: quoteSelect, orderBy: { created_at: 'desc' } },
    },
    orderBy: { created_at: 'desc' },
    take: 100,
  });
  return rows.map((row) => ({ ...row, quotes: row.quotes.map(toQuoteView) }));
}

export type CustomerRequest = Awaited<ReturnType<typeof getCustomerRequests>>[number];

export async function getProviderRequests(providerId: string) {
  return db.serviceRequest.findMany({
    where: { provider_id: providerId },
    select: {
      id: true,
      category: true,
      event_type: true,
      event_date: true,
      event_location: true,
      guest_count: true,
      budget_range: true,
      description: true,
      status: true,
      customer_id: true,
      customer_name: true,
      customer_email: true,
      customer_phone: true,
      preferred_contact: true,
      created_at: true,
      quotes: { select: { id: true, total_price: true, accepted: true, rejected_at: true, valid_until: true } },
    },
    orderBy: { created_at: 'desc' },
    take: 100,
  });
}

export type ProviderRequest = Awaited<ReturnType<typeof getProviderRequests>>[number];
