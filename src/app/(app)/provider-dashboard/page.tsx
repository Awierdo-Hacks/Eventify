import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CalendarCheck, Eye, FileText, Inbox, MessageSquare, Star } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { getUnreadCount } from '@/features/messaging/unread';
import { eventTypeLabel } from '@/lib/catalog';
import { db } from '@/lib/db';
import { formatDate, formatDateWeekday, formatPrice, formatRelative } from '@/lib/format';
import { requireProvider } from '@/lib/session';

export const metadata: Metadata = { title: 'Overzicht' };

export default async function ProviderOverviewPage() {
  const user = await requireProvider('/provider-dashboard');
  const providerId = user.providerId;
  const now = new Date();

  const [provider, newRequests, pendingQuotes, upcoming, unread, recentRequests] = await Promise.all([
    db.serviceProvider.findUnique({
      where: { id: providerId },
      select: {
        business_name: true,
        verified: true,
        is_active: true,
        rating_avg: true,
        review_count: true,
        images: true,
        description: true,
        _count: { select: { provider_services: true } },
      },
    }),
    db.serviceRequest.count({ where: { provider_id: providerId, status: 'PENDING' } }),
    db.quote.count({ where: { provider_id: providerId, accepted: false, rejected_at: null, valid_until: { gte: now } } }),
    db.booking.findMany({
      where: { provider_id: providerId, status: { in: ['PENDING', 'CONFIRMED'] }, event_date: { gte: now } },
      select: {
        id: true,
        event_date: true,
        event_location: true,
        final_price: true,
        customer: { select: { name: true } },
        request: { select: { event_type: true } },
      },
      orderBy: { event_date: 'asc' },
      take: 4,
    }),
    getUnreadCount(user.id),
    db.serviceRequest.findMany({
      where: { provider_id: providerId, status: 'PENDING' },
      select: { id: true, customer_name: true, event_type: true, event_date: true, guest_count: true, created_at: true },
      orderBy: { created_at: 'desc' },
      take: 4,
    }),
  ]);
  if (!provider) return null;

  const profileGaps = [
    provider.images.length === 0 && 'foto’s',
    provider._count.provider_services === 0 && 'diensten met richtprijzen',
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        title={provider.business_name}
        description="Aanvragen, offertes en boekingen in één oogopslag."
        actions={
          <Button asChild variant="outline">
            <Link href={`/providers/${providerId}`}>
              <Eye aria-hidden /> Bekijk je profiel
            </Link>
          </Button>
        }
      />

      {!provider.verified ? (
        <Alert tone="warning" title="Je profiel wacht op controle" className="mb-6">
          Ons team kijkt je profiel na voordat het zichtbaar wordt voor klanten.
          {profileGaps.length > 0 && (
            <>
              {' '}
              Vul intussen je profiel aan met {profileGaps.join(' en ')}:{' '}
              <Link href="/provider-dashboard/profile" className="font-bold underline underline-offset-2">
                naar je profiel
              </Link>
              .
            </>
          )}
        </Alert>
      ) : !provider.is_active ? (
        <Alert tone="warning" title="Je profiel staat verborgen" className="mb-6">
          Klanten kunnen je profiel nu niet vinden. Neem contact op met ons als je denkt dat dit niet klopt.
        </Alert>
      ) : profileGaps.length > 0 ? (
        <Alert tone="info" title="Maak je profiel sterker" className="mb-6">
          Profielen met {profileGaps.join(' en ')} krijgen meer aanvragen.{' '}
          <Link href="/provider-dashboard/profile" className="font-bold underline underline-offset-2">
            Profiel aanvullen
          </Link>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Nieuwe aanvragen"
          value={newRequests}
          icon={Inbox}
          href="/provider-dashboard/requests"
          highlight={newRequests > 0}
          hint={newRequests > 0 ? 'Wachten op je offerte' : undefined}
        />
        <StatCard label="Openstaande offertes" value={pendingQuotes} icon={FileText} href="/provider-dashboard/quotes" />
        <StatCard label="Ongelezen berichten" value={unread} icon={MessageSquare} href="/messages" highlight={unread > 0} />
        <StatCard
          label="Beoordeling"
          value={provider.review_count > 0 ? provider.rating_avg.toLocaleString('nl-BE', { maximumFractionDigits: 1, minimumFractionDigits: 1 }) : '–'}
          icon={Star}
          hint={provider.review_count > 0 ? `${provider.review_count} beoordelingen` : 'Nog geen beoordelingen'}
        />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="new-requests-title">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="new-requests-title" className="text-lg font-bold text-ink-950">
              Nieuwe aanvragen
            </h2>
            <Button asChild variant="link">
              <Link href="/provider-dashboard/requests">
                Alle aanvragen <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
          {recentRequests.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ink-200 bg-surface px-5 py-8 text-center text-sm text-ink-600">
              Geen aanvragen die op een offerte wachten.
            </p>
          ) : (
            <ul className="divide-y divide-ink-100 rounded-xl border border-ink-200 bg-surface">
              {recentRequests.map((request) => (
                <li key={request.id}>
                  <Link href="/provider-dashboard/requests" className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-ink-50">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-ink-950">{request.customer_name}</span>
                      <span className="block truncate text-sm text-ink-600">
                        {eventTypeLabel(request.event_type)} · {formatDate(request.event_date)}
                        {request.guest_count > 0 ? ` · ${request.guest_count} gasten` : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-ink-500">{formatRelative(request.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="upcoming-title">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="upcoming-title" className="text-lg font-bold text-ink-950">
              Komende boekingen
            </h2>
            <Button asChild variant="link">
              <Link href="/provider-dashboard/agenda">
                Agenda <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
          {upcoming.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ink-200 bg-surface px-5 py-8 text-center text-sm text-ink-600">
              Nog geen komende boekingen.
            </p>
          ) : (
            <ul className="divide-y divide-ink-100 rounded-xl border border-ink-200 bg-surface">
              {upcoming.map((booking) => (
                <li key={booking.id}>
                  <Link href="/provider-dashboard/bookings" className="flex items-center gap-4 p-4 transition-colors hover:bg-ink-50">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-success-100 text-success-700">
                      <CalendarCheck className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink-950">{booking.customer.name}</span>
                      <span className="block truncate text-sm text-ink-600">
                        {formatDateWeekday(booking.event_date)} · {eventTypeLabel(booking.request.event_type)}
                      </span>
                    </span>
                    <span className="shrink-0 font-bold tabular-nums text-ink-950">{formatPrice(booking.final_price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
