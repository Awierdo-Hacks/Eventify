import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, MapPin, Search, Users, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/ui/category-icon';
import { ProgressBar } from '@/features/events/components/event-card';
import { AddSlotButton, EventMenu, RemoveSlotButton } from '@/features/events/components/event-controls';
import { eventProgress, getCustomerEvent } from '@/features/events/queries';
import { QuoteCard } from '@/features/quotes/components/quote-card';
import { getCustomerQuotes, getLinkableSlots } from '@/features/quotes/queries';
import { SLOT_STATUS, categoryByKey, eventTypeLabel } from '@/lib/catalog';
import { formatDate, formatPrice, toDateKey } from '@/lib/format';
import { requireCustomer } from '@/lib/session';

type Params = Promise<{ id: string }>;

export const metadata: Metadata = { title: 'Event' };

export default async function EventDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await requireCustomer(`/dashboard/events/${id}`);

  const [event, allQuotes, linkableEvents] = await Promise.all([
    getCustomerEvent(user.id, id),
    getCustomerQuotes(user.id),
    getLinkableSlots(user.id),
  ]);
  if (!event) notFound();

  const progress = eventProgress(event.slots);
  const unlinked = allQuotes.filter((quote) => !quote.slotId && (quote.status === 'PENDING' || quote.status === 'ACCEPTED'));
  const bookedTotal = event.slots.reduce((sum, slot) => {
    const booked = slot.quotes.find((quote) => quote.id === slot.bookedQuoteId);
    return sum + (booked?.price ?? 0);
  }, 0);
  const budget = event.budget_max ?? event.budget_min;
  const budgetPercent = budget ? Math.min(100, Math.round((bookedTotal / budget) * 100)) : 0;
  const thisEvent = linkableEvents.filter((item) => item.id === event.id);

  const facts = [
    { icon: CalendarDays, label: 'Datum', value: event.event_date ? formatDate(event.event_date) : 'Nog niet gekozen' },
    { icon: MapPin, label: 'Plaats', value: event.location || 'Nog niet gekozen' },
    { icon: Users, label: 'Gasten', value: event.guest_count ? String(event.guest_count) : 'Nog niet bekend' },
    {
      icon: Wallet,
      label: 'Budget',
      value:
        event.budget_min && event.budget_max
          ? `${formatPrice(event.budget_min)} – ${formatPrice(event.budget_max)}`
          : budget
            ? formatPrice(budget)
            : 'Nog niet bepaald',
    },
  ];

  const browseHref = (category: string, slotId: string) => {
    const params = new URLSearchParams({ category: categoryByKey(category).slug, slot: slotId });
    if (event.location) params.set('location', event.location);
    return `/browse?${params.toString()}`;
  };

  return (
    <>
      <PageHeader
        title={event.name}
        description={eventTypeLabel(event.event_type)}
        back={{ href: '/dashboard/events', label: 'Events' }}
        actions={
          <EventMenu
            event={{
              id: event.id,
              name: event.name,
              eventDate: event.event_date ? toDateKey(event.event_date) : '',
              location: event.location ?? '',
              guestCount: event.guest_count?.toString() ?? '',
              budgetMin: event.budget_min?.toString() ?? '',
              budgetMax: event.budget_max?.toString() ?? '',
            }}
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ink-200 bg-ink-200 sm:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.label} className="bg-surface p-4">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
                  <fact.icon className="size-3.5" aria-hidden />
                  {fact.label}
                </dt>
                <dd className="mt-1 text-sm font-bold text-ink-950">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <section aria-labelledby="slots-title">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 id="slots-title" className="text-lg font-bold text-ink-950">
                Wat je nodig hebt
              </h2>
              <AddSlotButton eventId={event.id} />
            </div>

            <ul className="space-y-4">
              {event.slots.map((slot) => {
                const category = categoryByKey(slot.category);
                const label = slot.customName || category.label;
                const booked = slot.quotes.find((quote) => quote.id === slot.bookedQuoteId);
                const open = slot.quotes.filter((quote) => quote.id !== slot.bookedQuoteId);
                return (
                  <li key={slot.id} className="rounded-xl border border-ink-200 bg-surface shadow-xs">
                    <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
                      <CategoryIcon category={slot.category} />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-ink-950">{label}</h3>
                        <p className="text-sm text-ink-600">
                          {booked
                            ? `${booked.provider.name} · ${formatPrice(booked.price)}`
                            : open.length > 0
                              ? `${open.length} ${open.length === 1 ? 'offerte' : 'offertes'} om te vergelijken`
                              : slot.isRequired
                                ? 'Hoort standaard bij dit type event'
                                : 'Optioneel'}
                        </p>
                      </div>
                      <StatusBadge status={slot.status} map={SLOT_STATUS} />
                      {!booked && (
                        <div className="flex items-center gap-1">
                          <Button asChild size="sm" variant="outline">
                            <Link href={browseHref(slot.category, slot.id)}>
                              <Search aria-hidden /> Zoek {category.singular.toLowerCase()}
                            </Link>
                          </Button>
                          <RemoveSlotButton eventId={event.id} slotId={slot.id} label={label} />
                        </div>
                      )}
                    </div>
                    {slot.quotes.length > 0 && (
                      <div className="space-y-3 border-t border-ink-100 bg-ink-50/60 p-3 sm:p-4">
                        {[...(booked ? [booked] : []), ...open].map((quote) => (
                          <QuoteCard key={quote.id} quote={quote} viewer="customer" compact />
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            {event.slots.length === 0 && (
              <p className="rounded-xl border border-dashed border-ink-200 bg-surface px-5 py-8 text-center text-sm text-ink-600">
                Dit event heeft nog geen onderdelen. Voeg toe wat je nodig hebt.
              </p>
            )}
          </section>

          {unlinked.length > 0 && thisEvent.length > 0 && (
            <section aria-labelledby="unlinked-title">
              <h2 id="unlinked-title" className="text-lg font-bold text-ink-950">
                Offertes zonder event
              </h2>
              <p className="mb-4 mt-1 text-sm text-ink-600">
                Deze offertes horen nog nergens bij. Koppel ze aan een onderdeel om ze hier mee te tellen.
              </p>
              <div className="space-y-3">
                {unlinked.map((quote) => (
                  <QuoteCard key={quote.id} quote={quote} viewer="customer" linkableEvents={thisEvent} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-xl border border-ink-200 bg-surface p-5 shadow-xs">
            <h2 className="font-bold text-ink-950">Voortgang</h2>
            <div className="mt-4">
              <ProgressBar percent={progress.percent} label={`${progress.booked} van ${progress.total} vastgelegd`} />
            </div>
            {progress.withQuotes > 0 && (
              <p className="mt-3 text-sm text-ink-600">
                Voor {progress.withQuotes} {progress.withQuotes === 1 ? 'onderdeel' : 'onderdelen'} liggen offertes klaar.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-ink-200 bg-surface p-5 shadow-xs">
            <h2 className="font-bold text-ink-950">Kosten</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-600">Vastgelegd</dt>
                <dd className="font-bold tabular-nums text-ink-950">{formatPrice(bookedTotal)}</dd>
              </div>
              {budget ? (
                <>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-600">Budget</dt>
                    <dd className="font-semibold tabular-nums text-ink-900">{formatPrice(budget)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-ink-100 pt-2">
                    <dt className="text-ink-600">{bookedTotal > budget ? 'Boven budget' : 'Nog beschikbaar'}</dt>
                    <dd className={`font-bold tabular-nums ${bookedTotal > budget ? 'text-danger-700' : 'text-success-700'}`}>
                      {formatPrice(Math.abs(budget - bookedTotal))}
                    </dd>
                  </div>
                </>
              ) : null}
            </dl>
            {budget ? (
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink-100" aria-hidden>
                <div
                  className={`h-full rounded-full ${bookedTotal > budget ? 'bg-danger-600' : 'bg-brand-600'}`}
                  style={{ width: `${budgetPercent}%` }}
                />
              </div>
            ) : (
              <p className="mt-3 text-xs text-ink-500">Stel een budget in om te zien hoeveel ruimte je nog hebt.</p>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
