import Link from 'next/link';
import { CalendarDays, ChevronRight, MapPin, Users } from 'lucide-react';
import { StatusBadge } from '@/components/ui/badge';
import { EVENT_STATUS, eventTypeLabel } from '@/lib/catalog';
import { formatDate } from '@/lib/format';
import { eventProgress, type CustomerEvent } from '@/features/events/queries';

function ProgressBar({ percent, label }: { percent: number; label: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold text-ink-600">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="bg-brand-gradient h-full rounded-full transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function EventCard({ event }: { event: CustomerEvent }) {
  const progress = eventProgress(event.slots);
  return (
    <Link
      href={`/dashboard/events/${event.id}`}
      className="group flex h-full flex-col gap-4 rounded-xl border border-ink-200 bg-surface p-5 shadow-xs transition-[box-shadow,border-color] hover:border-ink-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
            {eventTypeLabel(event.event_type)}
          </p>
          <h3 className="mt-1 truncate text-lg font-bold text-ink-950">{event.name}</h3>
        </div>
        <StatusBadge status={event.status} map={EVENT_STATUS} />
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-ink-600">
        <li className="flex items-center gap-1.5">
          <CalendarDays className="size-4 text-ink-400" aria-hidden />
          {event.event_date ? formatDate(event.event_date) : 'Datum nog niet gekozen'}
        </li>
        {event.location && (
          <li className="flex items-center gap-1.5">
            <MapPin className="size-4 text-ink-400" aria-hidden />
            {event.location}
          </li>
        )}
        {event.guest_count ? (
          <li className="flex items-center gap-1.5">
            <Users className="size-4 text-ink-400" aria-hidden />
            {event.guest_count} gasten
          </li>
        ) : null}
      </ul>
      <div className="mt-auto space-y-3">
        <ProgressBar
          percent={progress.percent}
          label={`${progress.booked} van ${progress.total} vastgelegd`}
        />
        <p className="flex items-center justify-end gap-1 text-sm font-semibold text-brand-700">
          Bekijk event
          <ChevronRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </p>
      </div>
    </Link>
  );
}

export { EventCard, ProgressBar };
