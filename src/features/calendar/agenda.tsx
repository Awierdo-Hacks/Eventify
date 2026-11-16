'use client';

import * as React from 'react';
import {
  Ban,
  CalendarCheck,
  CalendarOff,
  CalendarSync,
  Link2,
  RefreshCw,
  Trash2,
  TrendingUp,
  Unlock,
} from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { MonthCalendar, todayKey, type DayInfo } from '@/components/ui/month-calendar';
import { useAction } from '@/hooks/use-action';
import { eventTypeLabel } from '@/lib/catalog';
import { formatDateWeekday, formatMonthYear, formatRelative } from '@/lib/format';
import {
  blockDatesAction,
  connectIcalAction,
  disconnectCalendarAction,
  syncCalendarsAction,
  unblockDatesAction,
} from '@/features/calendar/actions';
import type { AgendaData } from '@/features/calendar/queries';

const LEGEND = [
  { className: 'bg-surface ring-1 ring-ink-200', label: 'Beschikbaar' },
  { className: 'bg-success-100', label: 'Geboekt' },
  { className: 'bg-ink-200', label: 'Door jou geblokkeerd' },
  { className: 'bg-info-100', label: 'Bezet in gekoppelde kalender' },
];

function Agenda({ data }: { data: AgendaData }) {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [reason, setReason] = React.useState('');
  const clear = () => {
    setSelected([]);
    setReason('');
  };
  const block = useAction(blockDatesAction, { onSuccess: clear });
  const unblock = useAction(unblockDatesAction, { onSuccess: clear });

  const blocked = React.useMemo(
    () => new Map(data.blocked.map((row) => [row.date, row.reason])),
    [data.blocked]
  );
  const booked = React.useMemo(
    () => new Map(data.booked.map((row) => [row.date, row])),
    [data.booked]
  );
  const external = React.useMemo(
    () => new Map(data.external.map((row) => [row.date, row.source])),
    [data.external]
  );

  const dayInfo = (key: string): DayInfo | undefined => {
    const booking = booked.get(key);
    if (booking)
      return { tone: 'booked', disabled: true, label: `Geboekt door ${booking.customer}` };
    if (blocked.has(key))
      return {
        tone: 'blocked',
        label: blocked.get(key) ? `Geblokkeerd: ${blocked.get(key)}` : 'Geblokkeerd',
      };
    const source = external.get(key);
    if (source)
      return {
        tone: 'external',
        disabled: true,
        label: source === 'GOOGLE' ? 'Bezet in Google Calendar' : 'Bezet in iCal-kalender',
      };
    return undefined;
  };

  const toggle = (key: string) =>
    setSelected((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key].sort()
    );

  const selectedBlocked = selected.filter((key) => blocked.has(key));
  const selectedFree = selected.filter((key) => !blocked.has(key));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="min-w-0 space-y-4">
        <div className="rounded-xl border border-ink-200 bg-surface p-4 shadow-xs sm:p-6">
          <MonthCalendar
            selected={selected}
            onSelect={toggle}
            dayInfo={dayInfo}
            minKey={todayKey()}
            className="mx-auto max-w-md"
          />
          <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-ink-100 pt-4 text-xs font-medium text-ink-600">
            {LEGEND.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <span className={`size-3.5 rounded ${item.className}`} aria-hidden />
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        {selected.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-200 bg-surface px-5 py-4 text-center text-sm text-ink-600">
            Tik op een of meer dagen om ze te blokkeren of weer vrij te geven.
          </p>
        ) : (
          <div
            className="rounded-xl border border-brand-200 bg-brand-50 p-4 sm:p-5"
            role="region"
            aria-label="Geselecteerde dagen"
          >
            <p className="font-bold text-ink-950">
              {selected.length} {selected.length === 1 ? 'dag' : 'dagen'} geselecteerd
            </p>
            <p className="mt-0.5 text-sm text-ink-600">
              {selected
                .slice(0, 3)
                .map((key) => formatDateWeekday(`${key}T12:00:00`))
                .join(' · ')}
              {selected.length > 3 ? ` · +${selected.length - 3}` : ''}
            </p>
            {selectedFree.length > 0 && (
              <Field
                label="Reden"
                htmlFor="block-reason"
                optional
                className="mt-4"
                hint="Alleen voor jezelf, klanten zien dit niet."
              >
                <Input
                  id="block-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={200}
                  placeholder="bv. Vakantie"
                  aria-describedby="block-reason-hint"
                />
              </Field>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedFree.length > 0 && (
                <Button
                  loading={block.pending}
                  onClick={() => block.run({ dates: selectedFree, reason })}
                >
                  <Ban aria-hidden />{' '}
                  {selectedFree.length === 1
                    ? 'Dag blokkeren'
                    : `${selectedFree.length} dagen blokkeren`}
                </Button>
              )}
              {selectedBlocked.length > 0 && (
                <Button
                  variant="outline"
                  loading={unblock.pending}
                  onClick={() => unblock.run({ dates: selectedBlocked })}
                >
                  <Unlock aria-hidden />{' '}
                  {selectedBlocked.length === 1
                    ? 'Vrijgeven'
                    : `${selectedBlocked.length} vrijgeven`}
                </Button>
              )}
              <Button variant="ghost" onClick={clear}>
                Selectie wissen
              </Button>
            </div>
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <dl className="divide-y divide-ink-100 rounded-xl border border-ink-200 bg-surface px-5 shadow-xs">
          <div className="py-4">
            <dt className="flex items-center gap-2 text-xs font-medium text-ink-500">
              <CalendarCheck className="size-4 shrink-0 text-success-600" aria-hidden />
              Volgende boeking
            </dt>
            <dd className="mt-0.5 pl-6 text-sm font-semibold text-ink-900">
              {data.nextBooking ? (
                <>
                  {formatDateWeekday(data.nextBooking.date)}
                  <span className="block font-normal text-ink-600">
                    {data.nextBooking.customer} · {eventTypeLabel(data.nextBooking.eventType)}
                  </span>
                </>
              ) : (
                'Nog geen'
              )}
            </dd>
          </div>
          <div className="py-4">
            <dt className="flex items-center gap-2 text-xs font-medium text-ink-500">
              <TrendingUp className="size-4 shrink-0 text-brand-600" aria-hidden />
              Drukste maand
            </dt>
            <dd className="mt-0.5 pl-6 text-sm font-semibold capitalize text-ink-900">
              {data.busiestMonth
                ? `${formatMonthYear(`${data.busiestMonth.month}-15`)} (${data.busiestMonth.count})`
                : '–'}
            </dd>
          </div>
          <div className="py-4">
            <dt className="flex items-center gap-2 text-xs font-medium text-ink-500">
              <CalendarOff className="size-4 shrink-0 text-ink-400" aria-hidden />
              Geblokkeerde dagen
            </dt>
            <dd className="mt-0.5 pl-6 text-sm font-semibold text-ink-900">
              {data.blocked.filter((row) => row.date >= todayKey()).length}
            </dd>
          </div>
        </dl>

        <CalendarConnections sync={data.sync} />
      </aside>
    </div>
  );
}

function CalendarConnections({ sync }: { sync: AgendaData['sync'] }) {
  const [url, setUrl] = React.useState('');
  const connect = useAction(connectIcalAction, { onSuccess: () => setUrl(''), toastError: false });
  const disconnect = useAction(disconnectCalendarAction);
  const refresh = useAction(syncCalendarsAction);
  const hasConnection = Boolean(sync.google || sync.ical);

  return (
    <section
      className="rounded-xl border border-ink-200 bg-surface p-5 shadow-xs"
      aria-labelledby="sync-title"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="sync-title" className="flex items-center gap-2 font-bold text-ink-950">
          <CalendarSync className="size-5 text-brand-600" aria-hidden /> Kalenders koppelen
        </h2>
        {hasConnection && (
          <Button
            variant="ghost"
            size="icon-sm"
            loading={refresh.pending}
            onClick={() => refresh.run(undefined)}
            aria-label="Nu synchroniseren"
          >
            {!refresh.pending && <RefreshCw aria-hidden />}
          </Button>
        )}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-ink-600">
        Dagen waarop je al bezet bent worden automatisch geblokkeerd. We lezen alleen óf je bezet
        bent, nooit wat er in je agenda staat.
      </p>

      <div className="mt-4 space-y-3">
        {/* Google */}
        <div className="rounded-lg border border-ink-200 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink-950">Google Calendar</p>
              <p className="truncate text-xs text-ink-500">
                {sync.google
                  ? `${sync.google.email ?? 'Gekoppeld'}${sync.google.lastSynced ? ` · ${formatRelative(sync.google.lastSynced)}` : ''}`
                  : sync.googleAvailable
                    ? 'Niet gekoppeld'
                    : 'Binnenkort beschikbaar'}
              </p>
            </div>
            {sync.google ? (
              <Button
                variant="ghost"
                size="icon-sm"
                loading={disconnect.pending}
                onClick={() => disconnect.run({ type: 'GOOGLE' })}
                aria-label="Google Calendar ontkoppelen"
              >
                {!disconnect.pending && <Trash2 aria-hidden />}
              </Button>
            ) : (
              sync.googleAvailable && (
                <Button asChild variant="outline" size="sm">
                  {/* Full page navigation: this route redirects to Google. */}
                  <a href="/api/calendar/google/connect">Koppelen</a>
                </Button>
              )
            )}
          </div>
          {sync.google?.error && (
            <p className="mt-2 text-xs font-medium text-danger-700">{sync.google.error}</p>
          )}
        </div>

        {/* iCal */}
        <div className="rounded-lg border border-ink-200 p-3.5">
          {sync.ical ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink-950">iCal-kalender</p>
                  <p className="truncate text-xs text-ink-500">
                    {sync.ical.host}
                    {sync.ical.lastSynced ? ` · ${formatRelative(sync.ical.lastSynced)}` : ''}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  loading={disconnect.pending}
                  onClick={() => disconnect.run({ type: 'ICAL' })}
                  aria-label="iCal-kalender ontkoppelen"
                >
                  {!disconnect.pending && <Trash2 aria-hidden />}
                </Button>
              </div>
              {sync.ical.error && (
                <p className="mt-2 text-xs font-medium text-danger-700">{sync.ical.error}</p>
              )}
            </>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                connect.run({ url });
              }}
              className="space-y-2"
            >
              <label htmlFor="ical-url" className="text-sm font-bold text-ink-950">
                iCal-link (Apple, Outlook, …)
              </label>
              <Input
                id="ical-url"
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://…/basic.ics"
                className="h-10"
              />
              {connect.error && <Alert tone="danger">{connect.error}</Alert>}
              <Button
                type="submit"
                variant="outline"
                size="sm"
                loading={connect.pending}
                disabled={!url.trim()}
              >
                <Link2 aria-hidden /> Koppelen
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export { Agenda };
