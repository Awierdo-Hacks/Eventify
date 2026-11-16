'use client';

import * as React from 'react';
import Link from 'next/link';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, fieldProps } from '@/components/ui/field';
import { Input, Select, Textarea } from '@/components/ui/input';
import { MonthCalendar, todayKey } from '@/components/ui/month-calendar';
import { useAction } from '@/hooks/use-action';
import { PRICE_RANGES, PRICE_RANGE_LABELS, REQUEST_EVENT_TYPES } from '@/lib/catalog';
import { formatDateWeekday } from '@/lib/format';
import { createRequestAction } from '@/features/requests/actions';

interface RequestFormProps {
  providerId: string;
  providerName: string;
  unavailableDates: string[];
  defaults: {
    eventType?: string;
    eventDate?: string;
    eventLocation?: string;
    guestCount?: string;
    name: string;
    email: string;
    phone?: string;
  };
  slotId?: string;
}

function RequestForm({
  providerId,
  providerName,
  unavailableDates,
  defaults,
  slotId,
}: RequestFormProps) {
  const unavailable = React.useMemo(() => new Set(unavailableDates), [unavailableDates]);
  const initialDate =
    defaults.eventDate && !unavailable.has(defaults.eventDate) && defaults.eventDate >= todayKey()
      ? defaults.eventDate
      : '';
  const [eventDate, setEventDate] = React.useState(initialDate);
  const { run, pending, error, fieldErrors } = useAction(createRequestAction, {
    toastError: false,
  });

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? '');
    run({
      providerId,
      slotId,
      eventType: value('eventType'),
      eventDate,
      eventLocation: value('eventLocation'),
      guestCount: value('guestCount'),
      budgetRange: value('budgetRange') as '',
      description: value('description'),
      customerName: value('customerName'),
      customerEmail: value('customerEmail'),
      customerPhone: value('customerPhone'),
      preferredContact: value('preferredContact') as 'chat',
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate>
      <fieldset className="space-y-5">
        <legend className="text-lg font-bold text-ink-950">Je event</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Type event" htmlFor="eventType" error={fieldErrors.eventType}>
            <Select
              {...fieldProps('eventType', fieldErrors.eventType)}
              defaultValue={defaults.eventType ?? ''}
              required
            >
              <option value="" disabled>
                Kies een type
              </option>
              {REQUEST_EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Aantal gasten" htmlFor="guestCount" error={fieldErrors.guestCount}>
            <Input
              {...fieldProps('guestCount', fieldErrors.guestCount)}
              type="number"
              min={1}
              inputMode="numeric"
              defaultValue={defaults.guestCount}
              placeholder="bv. 80"
              required
            />
          </Field>
        </div>
        <Field label="Plaats of adres" htmlFor="eventLocation" error={fieldErrors.eventLocation}>
          <Input
            {...fieldProps('eventLocation', fieldErrors.eventLocation)}
            defaultValue={defaults.eventLocation}
            placeholder="bv. Antwerpen"
            required
          />
        </Field>

        <div>
          <p className="text-sm font-semibold text-ink-900" id="date-label">
            Datum
          </p>
          <div
            className="mt-1.5 rounded-xl border border-ink-200 bg-surface p-4 sm:max-w-sm"
            aria-labelledby="date-label"
          >
            <MonthCalendar
              selected={eventDate ? [eventDate] : []}
              onSelect={setEventDate}
              minKey={todayKey()}
              initialMonth={initialDate || undefined}
              dayInfo={(key) =>
                unavailable.has(key)
                  ? { tone: 'unavailable', disabled: true, label: 'Niet beschikbaar' }
                  : undefined
              }
            />
          </div>
          {fieldErrors.eventDate ? (
            <p role="alert" className="mt-1.5 text-sm font-medium text-danger-700">
              {fieldErrors.eventDate}
            </p>
          ) : (
            <p className="mt-1.5 text-sm text-ink-500">
              {eventDate
                ? `Gekozen: ${formatDateWeekday(`${eventDate}T12:00:00`)}`
                : `Doorgestreepte dagen zijn bezet bij ${providerName}.`}
            </p>
          )}
        </div>

        <Field label="Budget" htmlFor="budgetRange" optional error={fieldErrors.budgetRange}>
          <Select {...fieldProps('budgetRange', fieldErrors.budgetRange)} defaultValue="">
            <option value="">Geen voorkeur</option>
            {PRICE_RANGES.map((range) => (
              <option key={range} value={range}>
                {PRICE_RANGE_LABELS[range].symbol} · {PRICE_RANGE_LABELS[range].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Wat wil je nog kwijt?"
          htmlFor="description"
          optional
          error={fieldErrors.description}
        >
          <Textarea
            {...fieldProps('description', fieldErrors.description)}
            rows={4}
            maxLength={2000}
            placeholder="Vertel over je event en je wensen. Hoe meer de dienstverlener weet, hoe beter de offerte."
          />
        </Field>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="text-lg font-bold text-ink-950">Je contactgegevens</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Naam" htmlFor="customerName" error={fieldErrors.customerName}>
            <Input
              {...fieldProps('customerName', fieldErrors.customerName)}
              defaultValue={defaults.name}
              autoComplete="name"
              required
            />
          </Field>
          <Field label="Telefoonnummer" htmlFor="customerPhone" error={fieldErrors.customerPhone}>
            <Input
              {...fieldProps('customerPhone', fieldErrors.customerPhone)}
              type="tel"
              defaultValue={defaults.phone}
              autoComplete="tel"
              placeholder="+32 …"
              required
            />
          </Field>
          <Field label="E-mailadres" htmlFor="customerEmail" error={fieldErrors.customerEmail}>
            <Input
              {...fieldProps('customerEmail', fieldErrors.customerEmail)}
              type="email"
              defaultValue={defaults.email}
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Hoe wil je gecontacteerd worden?" htmlFor="preferredContact">
            <Select {...fieldProps('preferredContact')} defaultValue="chat">
              <option value="chat">Via de chat op Eventiphy</option>
              <option value="email">Per e-mail</option>
              <option value="phone">Telefonisch</option>
            </Select>
          </Field>
        </div>
      </fieldset>

      {error && !Object.keys(fieldErrors).length && <Alert tone="danger">{error}</Alert>}

      <div className="space-y-3">
        <Button
          type="submit"
          size="lg"
          variant="gradient"
          className="w-full sm:w-auto"
          loading={pending}
        >
          Offerte aanvragen
        </Button>
        <p className="text-xs leading-relaxed text-ink-500">
          We delen deze gegevens met {providerName} zodat ze een offerte kunnen opstellen en je
          kunnen bereiken. Een aanvraag is vrijblijvend. Meer in onze{' '}
          <Link
            href="/privacy"
            target="_blank"
            className="font-semibold underline underline-offset-2"
          >
            privacyverklaring
          </Link>
          .
        </p>
      </div>
    </form>
  );
}

export { RequestForm };
