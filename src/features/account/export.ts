import 'server-only';
import { db } from '@/lib/db';

/**
 * Everything we hold about a user, as structured data (GDPR art. 15 and 20).
 * Secrets (password hash, calendar tokens) are never included.
 */
export async function exportAccountData(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      first_name: true,
      last_name: true,
      date_of_birth: true,
      phone: true,
      role: true,
      status: true,
      created_at: true,
      updated_at: true,
      provider: {
        select: {
          id: true,
          business_name: true,
          category: true,
          location: true,
          price_range: true,
          description: true,
          services: true,
          images: true,
          portfolio_images: true,
          phone: true,
          btw_number: true,
          website: true,
          availability: true,
          min_guests: true,
          max_guests: true,
          response_time: true,
          verified: true,
          is_active: true,
          rating_avg: true,
          review_count: true,
          created_at: true,
          provider_services: { select: { name: true, description: true, price_from: true, price_to: true } },
          blocked_dates: { select: { date: true, reason: true } },
          calendar_integrations: { select: { type: true, google_account_email: true, last_synced_at: true, created_at: true } },
        },
      },
    },
  });
  if (!user) return null;
  const providerId = user.provider?.id;

  const [events, requests, quotes, bookings, reviews, messages, acceptances, consents, reports] = await Promise.all([
    db.event.findMany({
      where: { customer_id: userId },
      select: { name: true, event_type: true, event_date: true, location: true, guest_count: true, budget_min: true, budget_max: true, status: true, created_at: true, slots: { select: { category: true, custom_name: true, status: true } } },
    }),
    db.serviceRequest.findMany({
      where: { OR: [{ customer_id: userId }, ...(providerId ? [{ provider_id: providerId }] : [])] },
      select: { id: true, category: true, event_type: true, event_date: true, event_location: true, guest_count: true, budget_range: true, description: true, status: true, created_at: true, ...(providerId ? {} : { customer_name: true, customer_email: true, customer_phone: true, preferred_contact: true }) },
    }),
    db.quote.findMany({
      where: { OR: [{ request: { customer_id: userId } }, ...(providerId ? [{ provider_id: providerId }] : [])] },
      select: { id: true, request_id: true, total_price: true, message: true, included_services: true, terms: true, valid_until: true, accepted: true, rejected_at: true, rejection_reason: true, created_at: true },
    }),
    db.booking.findMany({
      where: { OR: [{ customer_id: userId }, ...(providerId ? [{ provider_id: providerId }] : [])] },
      select: { id: true, request_id: true, event_date: true, event_location: true, guest_count: true, final_price: true, status: true, created_at: true },
    }),
    db.review.findMany({
      where: { OR: [{ customer_id: userId }, ...(providerId ? [{ provider_id: providerId }] : [])] },
      select: { rating: true, title: true, comment: true, event_type: true, event_date: true, created_at: true },
    }),
    db.message.findMany({
      where: { sender_id: userId },
      select: { conversation_id: true, content: true, message_type: true, created_at: true, attachments: { select: { file_name: true, file_type: true, url: true } } },
      orderBy: { created_at: 'asc' },
    }),
    db.legalAcceptance.findMany({ where: { user_id: userId }, select: { document: true, version: true, accepted_at: true } }),
    db.consentRecord.findMany({ where: { user_id: userId }, select: { policy_version: true, analytics: true, marketing: true, created_at: true } }),
    db.contentReport.findMany({ where: { reporter_id: userId }, select: { target_type: true, reason: true, details: true, status: true, created_at: true } }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    notice:
      'Dit bestand bevat de persoonsgegevens die Eventiphy over je bewaart. Gegevens van andere gebruikers zijn niet opgenomen.',
    account: user,
    events,
    requests,
    quotes,
    bookings,
    reviews,
    messagesSent: messages,
    legalAcceptances: acceptances,
    cookieConsents: consents,
    contentReports: reports,
  };
}
