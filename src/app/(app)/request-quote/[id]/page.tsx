import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BadgeCheck, MapPin, Star } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { CategoryIcon } from '@/components/ui/category-icon';
import { getProviderProfile, getUnavailableDates } from '@/features/providers/queries';
import { RequestForm } from '@/features/requests/components/request-form';
import {
  categoryLabel,
  eventTypeLabel,
  priceRangeSymbol,
  REQUEST_EVENT_TYPES,
} from '@/lib/catalog';
import { db } from '@/lib/db';
import { toDateKey } from '@/lib/format';
import { requireCustomer } from '@/lib/session';

export const metadata: Metadata = { title: 'Offerte aanvragen' };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ slot?: string }> };

export default async function RequestQuotePage({ params, searchParams }: Props) {
  const [{ id }, { slot: slotId }] = await Promise.all([params, searchParams]);
  const user = await requireCustomer(`/request-quote/${id}`);

  const from = new Date();
  from.setUTCHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setUTCFullYear(to.getUTCFullYear() + 2);

  const [provider, unavailableDates, account, slot] = await Promise.all([
    getProviderProfile(id),
    getUnavailableDates(id, from, to),
    db.user.findUnique({ where: { id: user.id }, select: { phone: true } }),
    slotId
      ? db.eventSlot.findFirst({
          where: { id: slotId, event: { customer_id: user.id, status: { not: 'CANCELLED' } } },
          select: {
            id: true,
            event: {
              select: { event_type: true, event_date: true, location: true, guest_count: true },
            },
          },
        })
      : null,
  ]);
  if (!provider || !provider.isPublic) notFound();

  const eventLabel = slot ? eventTypeLabel(slot.event.event_type) : undefined;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="min-w-0 max-w-2xl">
        <PageHeader
          title="Offerte aanvragen"
          description={`Vertel ${provider.businessName} wat je plant.`}
          back={{ href: `/providers/${provider.id}`, label: provider.businessName }}
        />
        <RequestForm
          providerId={provider.id}
          providerName={provider.businessName}
          unavailableDates={unavailableDates}
          slotId={slot?.id}
          defaults={{
            eventType:
              eventLabel && REQUEST_EVENT_TYPES.includes(eventLabel) ? eventLabel : undefined,
            eventDate: slot?.event.event_date ? toDateKey(slot.event.event_date) : undefined,
            eventLocation: slot?.event.location ?? undefined,
            guestCount: slot?.event.guest_count?.toString(),
            name: user.name,
            email: user.email,
            phone: account?.phone ?? undefined,
          }}
        />
      </div>

      <aside className="lg:sticky lg:top-8 lg:self-start">
        <div className="rounded-xl border border-ink-200 bg-surface p-5 shadow-xs">
          <p className="text-xs font-medium text-ink-500">Je vraagt een offerte aan bij</p>
          <div className="mt-3 flex items-start gap-3">
            <CategoryIcon category={provider.category} />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 font-bold text-ink-950">
                <span className="truncate">{provider.businessName}</span>
                <BadgeCheck className="size-4 shrink-0 text-brand-600" aria-label="Geverifieerd" />
              </p>
              <p className="text-sm text-ink-600">{categoryLabel(provider.category)}</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-sm text-ink-600">
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-ink-400" aria-hidden />
              {provider.location}
            </li>
            {provider.reviewCount > 0 && (
              <li className="flex items-center gap-2">
                <Star
                  className="size-4 text-sun-400"
                  fill="currentColor"
                  strokeWidth={0}
                  aria-hidden
                />
                {provider.rating.toLocaleString('nl-BE', { minimumFractionDigits: 1 })} (
                {provider.reviewCount})
              </li>
            )}
            {priceRangeSymbol(provider.priceRange) && (
              <li>
                Prijsklasse{' '}
                <span className="font-semibold text-ink-900">
                  {priceRangeSymbol(provider.priceRange)}
                </span>
              </li>
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
}
