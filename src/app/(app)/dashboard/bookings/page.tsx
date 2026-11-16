import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarCheck, CalendarDays, Check, MapPin, Search, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/ui/category-icon';
import { EmptyState } from '@/components/ui/empty-state';
import {
  getCustomerBookings,
  splitByDate,
  type CustomerBooking,
} from '@/features/bookings/queries';
import { ChatButton } from '@/features/messaging/chat-button';
import { ReviewButton } from '@/features/reviews/components/review-dialog';
import { BOOKING_STATUS, eventTypeLabel } from '@/lib/catalog';
import { formatDateWeekday, formatPrice } from '@/lib/format';
import { requireCustomer } from '@/lib/session';

export const metadata: Metadata = { title: 'Boekingen' };

function BookingItem({ booking }: { booking: CustomerBooking }) {
  const quote = booking.request.quotes[0];
  return (
    <li className="rounded-xl border border-ink-200 bg-surface shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-4 p-5">
        <div className="flex min-w-0 items-start gap-3">
          <CategoryIcon category={booking.provider.category} />
          <div className="min-w-0">
            <h3 className="font-bold text-ink-950">
              <Link href={`/providers/${booking.provider.id}`} className="hover:text-brand-700">
                {booking.provider.business_name}
              </Link>
            </h3>
            <p className="text-sm text-ink-600">
              {eventTypeLabel(booking.request.event_type)}
              {quote?.message ? ` · ${quote.message}` : ''}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-extrabold tabular-nums text-ink-950">
            {formatPrice(booking.final_price)}
          </p>
          <StatusBadge status={booking.status} map={BOOKING_STATUS} className="mt-1" />
        </div>
      </div>
      <div className="space-y-3 border-t border-ink-100 px-5 py-4">
        <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-600">
          <li className="flex items-center gap-1.5">
            <CalendarDays className="size-4 text-ink-400" aria-hidden />
            {formatDateWeekday(booking.event_date)}
          </li>
          <li className="flex items-center gap-1.5">
            <MapPin className="size-4 text-ink-400" aria-hidden />
            {booking.event_location}
          </li>
          {booking.guest_count > 0 && (
            <li className="flex items-center gap-1.5">
              <Users className="size-4 text-ink-400" aria-hidden />
              {booking.guest_count} gasten
            </li>
          )}
        </ul>
        {quote && quote.included_services.length > 0 && (
          <ul className="grid gap-1.5 text-sm text-ink-800 sm:grid-cols-2">
            {quote.included_services.map((service) => (
              <li key={service} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-success-600" aria-hidden />
                {service}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 px-5 py-3">
        {booking.status === 'COMPLETED' &&
          (booking.reviewed ? (
            <Badge tone="success">
              <Check aria-hidden /> Beoordeling geplaatst
            </Badge>
          ) : (
            <ReviewButton bookingId={booking.id} providerName={booking.provider.business_name} />
          ))}
        <ChatButton recipientId={booking.provider.user_id} className="ml-auto" />
      </div>
    </li>
  );
}

export default async function CustomerBookingsPage() {
  const user = await requireCustomer('/dashboard/bookings');
  const bookings = await getCustomerBookings(user.id);
  const { upcoming, past } = splitByDate(bookings);

  return (
    <>
      <PageHeader
        title="Boekingen"
        description="De afspraken die je met dienstverleners hebt vastgelegd."
      />

      {bookings.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="Nog geen boekingen"
          description="Zodra je een offerte accepteert, staat de afspraak hier."
          action={
            <Button asChild>
              <Link href="/browse">
                <Search aria-hidden /> Dienstverleners zoeken
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-10">
          {upcoming.length > 0 && (
            <section aria-labelledby="upcoming-title">
              <h2 id="upcoming-title" className="mb-4 text-lg font-bold text-ink-950">
                Komend
              </h2>
              <ul className="space-y-4">
                {upcoming.map((booking) => (
                  <BookingItem key={booking.id} booking={booking} />
                ))}
              </ul>
            </section>
          )}
          {past.length > 0 && (
            <section aria-labelledby="past-title">
              <h2 id="past-title" className="mb-4 text-lg font-bold text-ink-950">
                Eerder
              </h2>
              <ul className="space-y-4">
                {past.map((booking) => (
                  <BookingItem key={booking.id} booking={booking} />
                ))}
              </ul>
            </section>
          )}
          <p className="text-xs leading-relaxed text-ink-500">
            “Vastgelegd” betekent dat jij en de dienstverlener een afspraak hebben. Betalen doe je
            rechtstreeks aan de dienstverlener, volgens wat jullie afspraken. Wil je een afspraak
            wijzigen of annuleren, neem dan contact op met de dienstverlener.
          </p>
        </div>
      )}
    </>
  );
}
