import type { Metadata } from 'next';
import { CalendarCheck, CalendarDays, Check, Mail, MapPin, Phone, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { getProviderBookings, splitByDate, type ProviderBooking } from '@/features/bookings/queries';
import { ChatButton } from '@/features/messaging/chat-button';
import { BookingActions } from '@/features/provider-area/components/booking-actions';
import { BOOKING_STATUS, eventTypeLabel } from '@/lib/catalog';
import { formatDateWeekday, formatPrice } from '@/lib/format';
import { requireProvider } from '@/lib/session';

export const metadata: Metadata = { title: 'Boekingen' };

function BookingItem({ booking }: { booking: ProviderBooking }) {
  const quote = booking.request.quotes[0];
  const deleted = Boolean(booking.customer.deleted_at);
  const email = booking.request.customer_email;
  const phone = booking.request.customer_phone;
  return (
    <li className="rounded-xl border border-ink-200 bg-surface shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <h3 className="font-bold text-ink-950">{booking.customer.name}</h3>
          <p className="text-sm text-ink-600">
            {eventTypeLabel(booking.request.event_type)}
            {quote?.message ? ` · ${quote.message}` : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-extrabold tabular-nums text-ink-950">{formatPrice(booking.final_price)}</p>
          <StatusBadge status={booking.status} map={BOOKING_STATUS} className="mt-1" />
        </div>
      </div>
      <div className="space-y-3 border-t border-ink-100 px-5 py-4">
        <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-700">
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
        {!deleted && (
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
            {email && (
              <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 font-medium text-ink-700 hover:text-brand-700">
                <Mail className="size-4 text-ink-400" aria-hidden />
                {email}
              </a>
            )}
            {phone && (
              <a href={`tel:${phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 font-medium text-ink-700 hover:text-brand-700">
                <Phone className="size-4 text-ink-400" aria-hidden />
                {phone}
              </a>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 px-5 py-3">
        <BookingActions
          bookingId={booking.id}
          status={booking.status}
          customerName={booking.customer.name}
          eventPassed={booking.event_date.getTime() <= Date.now()}
        />
        {!deleted && <ChatButton recipientId={booking.customer.id} className="ml-auto" />}
      </div>
    </li>
  );
}

export default async function ProviderBookingsPage() {
  const user = await requireProvider('/provider-dashboard/bookings');
  const bookings = await getProviderBookings(user.providerId);
  const { upcoming, past } = splitByDate(bookings);
  const toComplete = past.filter((booking) => booking.status === 'CONFIRMED');
  const history = past.filter((booking) => booking.status !== 'CONFIRMED');

  const sections = [
    { id: 'to-complete', title: 'Af te ronden', items: toComplete, hint: 'Het event is voorbij. Rond de boeking af zodat de klant je kan beoordelen.' },
    { id: 'upcoming', title: 'Komend', items: upcoming },
    { id: 'history', title: 'Geschiedenis', items: history },
  ];

  return (
    <>
      <PageHeader title="Boekingen" description="Afspraken die klanten met je hebben vastgelegd." />
      {bookings.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="Nog geen boekingen"
          description="Wanneer een klant je offerte accepteert, verschijnt de boeking hier en in je agenda."
        />
      ) : (
        <div className="space-y-10">
          {sections.map(
            (section) =>
              section.items.length > 0 && (
                <section key={section.id} aria-labelledby={`${section.id}-title`}>
                  <h2 id={`${section.id}-title`} className="text-lg font-bold text-ink-950">
                    {section.title} ({section.items.length})
                  </h2>
                  {section.hint && <p className="mt-1 text-sm text-ink-600">{section.hint}</p>}
                  <ul className="mt-4 space-y-4">
                    {section.items.map((booking) => (
                      <BookingItem key={booking.id} booking={booking} />
                    ))}
                  </ul>
                </section>
              ),
          )}
        </div>
      )}
    </>
  );
}
