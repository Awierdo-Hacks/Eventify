import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CalendarCheck, FileText, MessageSquare, PartyPopper, Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/ui/category-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { StatCard } from '@/components/ui/stat-card';
import { EventCard } from '@/features/events/components/event-card';
import { getCustomerEvents } from '@/features/events/queries';
import { getUnreadCount } from '@/features/messaging/unread';
import { db } from '@/lib/db';
import { formatDate, formatPrice } from '@/lib/format';
import { requireCustomer } from '@/lib/session';

export const metadata: Metadata = { title: 'Overzicht' };

export default async function CustomerOverviewPage({ searchParams }: { searchParams: Promise<{ welkom?: string }> }) {
  const user = await requireCustomer('/dashboard');
  const now = new Date();

  // One round of parallel queries; each selects only what this page shows.
  const [{ welkom }, events, openQuotes, upcomingBookings, unread] = await Promise.all([
    searchParams,
    getCustomerEvents(user.id),
    db.quote.findMany({
      where: { request: { customer_id: user.id }, accepted: false, rejected_at: null, valid_until: { gte: now } },
      select: {
        id: true,
        total_price: true,
        message: true,
        valid_until: true,
        provider: { select: { business_name: true, category: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 4,
    }),
    db.booking.findMany({
      where: { customer_id: user.id, status: { in: ['PENDING', 'CONFIRMED'] }, event_date: { gte: now } },
      select: {
        id: true,
        event_date: true,
        final_price: true,
        provider: { select: { business_name: true, category: true } },
      },
      orderBy: { event_date: 'asc' },
      take: 4,
    }),
    getUnreadCount(user.id),
  ]);

  const firstName = user.name.split(' ')[0];
  const activeEvents = events.filter((event) => event.status === 'PLANNING' || event.status === 'ACTIVE');

  return (
    <>
      <PageHeader
        title={`Hallo ${firstName}`}
        description="Dit is waar je staat met je events."
        actions={
          <Button asChild>
            <Link href="/dashboard/events/new">
              <Plus aria-hidden /> Nieuw event
            </Link>
          </Button>
        }
      />

      {welkom && (
        <Alert tone="success" title="Welkom bij Eventiphy!" className="mb-6">
          Je account is aangemaakt. Begin met een event of zoek meteen een dienstverlener.
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Lopende events" value={activeEvents.length} icon={PartyPopper} href="/dashboard/events" />
        <StatCard
          label="Offertes om te bekijken"
          value={openQuotes.length}
          icon={FileText}
          href="/dashboard/requests"
          highlight={openQuotes.length > 0}
        />
        <StatCard label="Komende boekingen" value={upcomingBookings.length} icon={CalendarCheck} href="/dashboard/bookings" />
        <StatCard label="Ongelezen berichten" value={unread} icon={MessageSquare} href="/messages" highlight={unread > 0} />
      </div>

      <section className="mt-10" aria-labelledby="events-title">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="events-title" className="text-lg font-bold text-ink-950">
            Je events
          </h2>
          {activeEvents.length > 0 && (
            <Button asChild variant="link">
              <Link href="/dashboard/events">
                Alle events <ArrowRight aria-hidden />
              </Link>
            </Button>
          )}
        </div>
        {activeEvents.length === 0 ? (
          <EmptyState
            icon={PartyPopper}
            title="Nog geen event"
            description="Maak een event aan en kies wat je nodig hebt. Zo houd je overzicht over offertes en boekingen."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild>
                  <Link href="/dashboard/events/new">
                    <Plus aria-hidden /> Event aanmaken
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/browse">
                    <Search aria-hidden /> Dienstverleners zoeken
                  </Link>
                </Button>
              </div>
            }
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {activeEvents.slice(0, 4).map((event) => (
              <li key={event.id}>
                <EventCard event={event} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="quotes-title">
          <h2 id="quotes-title" className="mb-4 text-lg font-bold text-ink-950">
            Offertes die op je wachten
          </h2>
          {openQuotes.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ink-200 bg-surface px-5 py-8 text-center text-sm text-ink-600">
              Geen openstaande offertes.
            </p>
          ) : (
            <ul className="divide-y divide-ink-100 rounded-xl border border-ink-200 bg-surface">
              {openQuotes.map((quote) => (
                <li key={quote.id}>
                  <Link href="/dashboard/requests" className="flex items-center gap-3 p-4 transition-colors hover:bg-ink-50">
                    <CategoryIcon category={quote.provider.category} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink-950">{quote.provider.business_name}</span>
                      <span className="block truncate text-sm text-ink-600">Geldig tot {formatDate(quote.valid_until)}</span>
                    </span>
                    <span className="font-bold tabular-nums text-ink-950">{formatPrice(quote.total_price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="bookings-title">
          <h2 id="bookings-title" className="mb-4 text-lg font-bold text-ink-950">
            Komende boekingen
          </h2>
          {upcomingBookings.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ink-200 bg-surface px-5 py-8 text-center text-sm text-ink-600">
              Nog niets vastgelegd.
            </p>
          ) : (
            <ul className="divide-y divide-ink-100 rounded-xl border border-ink-200 bg-surface">
              {upcomingBookings.map((booking) => (
                <li key={booking.id}>
                  <Link href="/dashboard/bookings" className="flex items-center gap-3 p-4 transition-colors hover:bg-ink-50">
                    <CategoryIcon category={booking.provider.category} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink-950">{booking.provider.business_name}</span>
                      <span className="block truncate text-sm text-ink-600">{formatDate(booking.event_date)}</span>
                    </span>
                    <span className="font-bold tabular-nums text-ink-950">{formatPrice(booking.final_price)}</span>
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
