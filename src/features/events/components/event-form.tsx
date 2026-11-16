'use client';

import * as React from 'react';
import {
  Building2,
  Cake,
  ClipboardList,
  Heart,
  Music4,
  Plus,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/ui/category-icon';
import { Field, fieldProps } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAction } from '@/hooks/use-action';
import {
  CATEGORIES,
  EVENT_TEMPLATES,
  EVENT_TYPES,
  categoryByKey,
  type CategoryKey,
  type EventTypeKey,
} from '@/lib/catalog';
import { cn } from '@/lib/utils';
import { createEventAction } from '@/features/events/actions';

const TYPE_ICONS: Record<EventTypeKey, LucideIcon> = {
  WEDDING: Heart,
  BIRTHDAY: Cake,
  CORPORATE: Building2,
  FESTIVAL: Music4,
  CUSTOM: ClipboardList,
};

const ALL_KEYS = CATEGORIES.map((category) => category.key).filter(
  (key): key is CategoryKey => key !== null
);

/** Create an event: pick a template, adjust what you need, add the details. */
function EventForm() {
  const [eventType, setEventType] = React.useState<EventTypeKey | null>(null);
  const [selected, setSelected] = React.useState<CategoryKey[]>([]);
  const { run, pending, error, fieldErrors } = useAction(createEventAction, { toastError: false });

  const chooseType = (type: EventTypeKey) => {
    setEventType(type);
    setSelected(EVENT_TEMPLATES[type].requiredSlots);
  };

  const toggle = (key: CategoryKey) =>
    setSelected((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );

  const template = eventType ? EVENT_TEMPLATES[eventType] : null;
  const suggested = template ? template.optionalSlots.filter((key) => !selected.includes(key)) : [];
  const others = ALL_KEYS.filter((key) => !selected.includes(key) && !suggested.includes(key));

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!eventType) return;
    const form = new FormData(event.currentTarget);
    const required = new Set(EVENT_TEMPLATES[eventType].requiredSlots);
    run({
      eventType,
      name: String(form.get('name') ?? ''),
      eventDate: String(form.get('eventDate') ?? ''),
      location: String(form.get('location') ?? ''),
      guestCount: String(form.get('guestCount') ?? '') as '',
      budgetMin: String(form.get('budgetMin') ?? '') as '',
      budgetMax: String(form.get('budgetMax') ?? '') as '',
      slots: selected.map((category) => ({ category, isRequired: required.has(category) })),
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-10" noValidate>
      <fieldset>
        <legend className="text-lg font-bold text-ink-950">1. Wat ga je vieren?</legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EVENT_TYPES.map((type) => {
            const Icon = TYPE_ICONS[type];
            const active = eventType === type;
            return (
              <label
                key={type}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600',
                  active
                    ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600'
                    : 'border-ink-200 bg-surface hover:border-ink-300'
                )}
              >
                <input
                  type="radio"
                  name="eventType"
                  className="sr-only"
                  checked={active}
                  onChange={() => chooseType(type)}
                />
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-lg',
                    active ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600'
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-bold text-ink-950">
                    {EVENT_TEMPLATES[type].label}
                  </span>
                  <span className="block text-sm text-ink-600">
                    {EVENT_TEMPLATES[type].description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {eventType && (
        <>
          <fieldset>
            <legend className="text-lg font-bold text-ink-950">2. Wat heb je nodig?</legend>
            <p className="mt-1 text-sm text-ink-600">Je kunt dit later altijd aanpassen.</p>

            {selected.length > 0 ? (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {selected.map((key) => (
                  <li
                    key={key}
                    className="flex items-center gap-3 rounded-xl border border-ink-200 bg-surface p-3"
                  >
                    <CategoryIcon category={key} size="sm" />
                    <span className="flex-1 text-sm font-semibold text-ink-950">
                      {categoryByKey(key).label}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      className="flex size-8 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 hover:text-danger-700"
                      aria-label={`${categoryByKey(key).label} verwijderen`}
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-ink-200 px-4 py-6 text-center text-sm text-ink-600">
                Kies hieronder minstens één onderdeel.
              </p>
            )}
            {fieldErrors.slots && (
              <p role="alert" className="mt-2 text-sm font-medium text-danger-700">
                {fieldErrors.slots}
              </p>
            )}

            {[
              { title: 'Vaak gekozen bij dit type event', keys: suggested },
              { title: 'Nog toevoegen', keys: others },
            ].map(
              (group) =>
                group.keys.length > 0 && (
                  <div key={group.title} className="mt-5">
                    <p className="text-sm font-semibold text-ink-700">{group.title}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {group.keys.map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggle(key)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-surface px-3 py-1.5 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-400 hover:text-brand-800"
                        >
                          <Plus className="size-3.5" aria-hidden />
                          {categoryByKey(key).label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
            )}
          </fieldset>

          <fieldset>
            <legend className="text-lg font-bold text-ink-950">3. De details</legend>
            <p className="mt-1 text-sm text-ink-600">
              Alleen de naam is verplicht. De rest vul je aan wanneer je het weet.
            </p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <Field
                label="Naam van je event"
                htmlFor="name"
                error={fieldErrors.name}
                className="sm:col-span-2"
              >
                <Input
                  {...fieldProps('name', fieldErrors.name)}
                  placeholder="bv. Bruiloft Emma & Lars"
                  required
                />
              </Field>
              <Field label="Datum" htmlFor="eventDate" optional error={fieldErrors.eventDate}>
                <Input {...fieldProps('eventDate', fieldErrors.eventDate)} type="date" />
              </Field>
              <Field label="Plaats" htmlFor="location" optional error={fieldErrors.location}>
                <Input
                  {...fieldProps('location', fieldErrors.location)}
                  placeholder="bv. Antwerpen"
                />
              </Field>
              <Field
                label="Aantal gasten"
                htmlFor="guestCount"
                optional
                error={fieldErrors.guestCount}
              >
                <Input
                  {...fieldProps('guestCount', fieldErrors.guestCount)}
                  type="number"
                  min={1}
                  inputMode="numeric"
                  placeholder="bv. 100"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Budget van (€)"
                  htmlFor="budgetMin"
                  optional
                  error={fieldErrors.budgetMin}
                >
                  <Input
                    {...fieldProps('budgetMin', fieldErrors.budgetMin)}
                    type="number"
                    min={0}
                    inputMode="numeric"
                  />
                </Field>
                <Field label="tot (€)" htmlFor="budgetMax" optional error={fieldErrors.budgetMax}>
                  <Input
                    {...fieldProps('budgetMax', fieldErrors.budgetMax)}
                    type="number"
                    min={0}
                    inputMode="numeric"
                  />
                </Field>
              </div>
            </div>
          </fieldset>

          {error && !Object.keys(fieldErrors).length && <Alert tone="danger">{error}</Alert>}

          <div className="flex justify-end">
            <Button type="submit" size="lg" loading={pending} disabled={selected.length === 0}>
              Event aanmaken
            </Button>
          </div>
        </>
      )}
    </form>
  );
}

export { EventForm };
