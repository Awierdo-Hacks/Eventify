import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, FileText, MapPin, Search, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Alert } from '@/components/ui/alert';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/ui/category-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { QuoteCard } from '@/features/quotes/components/quote-card';
import { getLinkableSlots } from '@/features/quotes/queries';
import { getCustomerRequests } from '@/features/requests/queries';
import { REQUEST_STATUS, eventTypeLabel } from '@/lib/catalog';
import { formatDate, formatRelative } from '@/lib/format';
import { requireCustomer } from '@/lib/session';

export const metadata: Metadata = { title: 'Offertes' };

export default async function CustomerRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ verstuurd?: string }>;
}) {
  const user = await requireCustomer('/dashboard/requests');
  const [{ verstuurd }, requests, linkableEvents] = await Promise.all([
    searchParams,
    getCustomerRequests(user.id),
    getLinkableSlots(user.id),
  ]);

  return (
    <>
      <PageHeader
        title="Offertes"
        description="Je aanvragen en de offertes die je erop ontving."
        actions={
          <Button asChild variant="outline">
            <Link href="/browse">
              <Search aria-hidden /> Nieuwe aanvraag
            </Link>
          </Button>
        }
      />

      {verstuurd && (
        <Alert tone="success" title="Je aanvraag is verstuurd" className="mb-6">
          De dienstverlener krijgt je aanvraag te zien en stuurt je een offerte. Je vindt ze hier
          terug.
        </Alert>
      )}

      {requests.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nog geen aanvragen"
          description="Zoek een dienstverlener en vraag vrijblijvend een offerte aan."
          action={
            <Button asChild>
              <Link href="/browse">
                <Search aria-hidden /> Dienstverleners zoeken
              </Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-5">
          {requests.map((request) => (
            <li key={request.id} className="rounded-xl border border-ink-200 bg-surface shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-3 p-5">
                <div className="flex min-w-0 items-start gap-3">
                  <CategoryIcon category={request.provider?.category ?? request.category} />
                  <div className="min-w-0">
                    <h2 className="font-bold text-ink-950">
                      {request.provider ? (
                        <Link
                          href={`/providers/${request.provider.id}`}
                          className="hover:text-brand-700"
                        >
                          {request.provider.business_name}
                        </Link>
                      ) : (
                        'Dienstverlener niet meer beschikbaar'
                      )}
                    </h2>
                    <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-600">
                      <li className="font-semibold text-ink-800">
                        {eventTypeLabel(request.event_type)}
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CalendarDays className="size-4 text-ink-400" aria-hidden />
                        {formatDate(request.event_date)}
                      </li>
                      <li className="flex items-center gap-1.5">
                        <MapPin className="size-4 text-ink-400" aria-hidden />
                        {request.event_location}
                      </li>
                      {request.guest_count > 0 && (
                        <li className="flex items-center gap-1.5">
                          <Users className="size-4 text-ink-400" aria-hidden />
                          {request.guest_count} gasten
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={request.status} map={REQUEST_STATUS} />
                  <p className="mt-1 text-xs text-ink-500">
                    Aangevraagd {formatRelative(request.created_at)}
                  </p>
                </div>
              </div>

              <div className="space-y-3 border-t border-ink-100 bg-ink-50/60 p-3 sm:p-4">
                {request.quotes.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-ink-600">
                    Nog geen offerte ontvangen. Je krijgt hier bericht zodra de dienstverlener
                    reageert.
                  </p>
                ) : (
                  request.quotes.map((quote) => (
                    <QuoteCard
                      key={quote.id}
                      quote={quote}
                      viewer="customer"
                      linkableEvents={linkableEvents}
                      compact
                    />
                  ))
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
