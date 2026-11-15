import type { Metadata } from 'next';
import { CalendarDays, Inbox, Mail, MapPin, Phone, Users, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ChatButton } from '@/features/messaging/chat-button';
import { CreateQuoteButton } from '@/features/provider-area/components/create-quote-button';
import { getProviderRequests, type ProviderRequest } from '@/features/requests/queries';
import { PRICE_RANGE_LABELS, eventTypeLabel, type PriceRangeKey, type StatusMeta } from '@/lib/catalog';
import { formatDateWeekday, formatPrice, formatRelative } from '@/lib/format';
import { requireProvider } from '@/lib/session';

export const metadata: Metadata = { title: 'Aanvragen' };

/** How a request looks from the provider's side. */
const PROVIDER_REQUEST_STATUS: Record<string, StatusMeta> = {
  PENDING: { label: 'Wacht op je offerte', tone: 'warning' },
  QUOTED: { label: 'Offerte verstuurd', tone: 'brand' },
  ACCEPTED: { label: 'Geaccepteerd', tone: 'success' },
  REJECTED: { label: 'Afgewezen', tone: 'danger' },
  CANCELLED: { label: 'Geannuleerd', tone: 'neutral' },
};

const CONTACT_LABELS: Record<string, string> = { chat: 'via de chat', email: 'per e-mail', phone: 'telefonisch' };

function RequestItem({ request }: { request: ProviderRequest }) {
  const activeQuote = request.quotes.find((quote) => !quote.rejected_at);
  const rejected = request.quotes.length > 0 && !activeQuote;
  const canQuote = (request.status === 'PENDING' || request.status === 'QUOTED') && !activeQuote;
  const budget = request.budget_range ? PRICE_RANGE_LABELS[request.budget_range as PriceRangeKey] : null;

  return (
    <li className="rounded-xl border border-ink-200 bg-surface shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <h2 className="font-bold text-ink-950">{request.customer_name}</h2>
          <p className="text-sm font-semibold text-brand-700">{eventTypeLabel(request.event_type)}</p>
        </div>
        <div className="text-right">
          <StatusBadge status={rejected && request.status !== 'ACCEPTED' ? 'REJECTED' : request.status} map={PROVIDER_REQUEST_STATUS} />
          <p className="mt-1 text-xs text-ink-500">Ontvangen {formatRelative(request.created_at)}</p>
        </div>
      </div>

      <div className="space-y-4 border-t border-ink-100 px-5 py-4">
        <ul className="grid gap-2 text-sm text-ink-700 sm:grid-cols-2">
          <li className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0 text-ink-400" aria-hidden />
            {formatDateWeekday(request.event_date)}
          </li>
          <li className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-ink-400" aria-hidden />
            {request.event_location}
          </li>
          {request.guest_count > 0 && (
            <li className="flex items-center gap-2">
              <Users className="size-4 shrink-0 text-ink-400" aria-hidden />
              {request.guest_count} gasten
            </li>
          )}
          {budget && (
            <li className="flex items-center gap-2">
              <Wallet className="size-4 shrink-0 text-ink-400" aria-hidden />
              Budget: {budget.symbol} ({budget.label})
            </li>
          )}
        </ul>

        {request.description && (
          <p className="whitespace-pre-line rounded-lg bg-ink-50 px-4 py-3 text-sm leading-relaxed text-ink-700">{request.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
          <a href={`mailto:${request.customer_email}`} className="inline-flex items-center gap-1.5 font-medium text-ink-700 hover:text-brand-700">
            <Mail className="size-4 text-ink-400" aria-hidden />
            {request.customer_email}
          </a>
          {request.customer_phone && (
            <a href={`tel:${request.customer_phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 font-medium text-ink-700 hover:text-brand-700">
              <Phone className="size-4 text-ink-400" aria-hidden />
              {request.customer_phone}
            </a>
          )}
          {request.preferred_contact && CONTACT_LABELS[request.preferred_contact] && (
            <span className="text-ink-500">Bij voorkeur {CONTACT_LABELS[request.preferred_contact]}</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 px-5 py-3">
        {canQuote && <CreateQuoteButton requestId={request.id} customerName={request.customer_name} resend={rejected} />}
        {activeQuote && (
          <p className="text-sm text-ink-600">
            Je offerte: <span className="font-bold text-ink-950">{formatPrice(activeQuote.total_price)}</span>
          </p>
        )}
        <ChatButton recipientId={request.customer_id} className="ml-auto" />
      </div>
    </li>
  );
}

export default async function ProviderRequestsPage() {
  const user = await requireProvider('/provider-dashboard/requests');
  const requests = await getProviderRequests(user.providerId);
  const open = requests.filter((request) => request.status === 'PENDING');
  const others = requests.filter((request) => request.status !== 'PENDING');

  return (
    <>
      <PageHeader title="Aanvragen" description="Klanten die een offerte van je willen." />
      {requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nog geen aanvragen"
          description="Zodra een klant een offerte bij je aanvraagt, zie je dat hier. Een volledig profiel met foto’s helpt."
        />
      ) : (
        <div className="space-y-10">
          {open.length > 0 && (
            <section aria-labelledby="open-title">
              <h2 id="open-title" className="mb-4 text-lg font-bold text-ink-950">
                Wachten op je offerte ({open.length})
              </h2>
              <ul className="space-y-4">
                {open.map((request) => (
                  <RequestItem key={request.id} request={request} />
                ))}
              </ul>
            </section>
          )}
          {others.length > 0 && (
            <section aria-labelledby="handled-title">
              <h2 id="handled-title" className="mb-4 text-lg font-bold text-ink-950">
                Beantwoord
              </h2>
              <ul className="space-y-4">
                {others.map((request) => (
                  <RequestItem key={request.id} request={request} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </>
  );
}
