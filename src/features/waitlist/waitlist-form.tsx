'use client';

import * as React from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, fieldProps } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { useAction } from '@/hooks/use-action';
import { CATEGORIES } from '@/lib/catalog';
import { cn } from '@/lib/utils';
import { joinWaitlistAction } from '@/features/waitlist/actions';

const TYPES = [
  { value: 'CUSTOMER', label: 'Ik plan een event', hint: 'Als klant' },
  { value: 'PROVIDER', label: 'Ik bied diensten aan', hint: 'Als dienstverlener' },
] as const;

function WaitlistForm() {
  const [type, setType] = React.useState<'CUSTOMER' | 'PROVIDER'>('CUSTOMER');
  const [categories, setCategories] = React.useState<string[]>([]);
  const [done, setDone] = React.useState(false);
  const { run, pending, error, fieldErrors } = useAction(joinWaitlistAction, {
    onSuccess: () => setDone(true),
    toastError: false,
  });

  if (done) {
    return (
      <div className="flex flex-col items-center py-8 text-center" role="status">
        <span className="flex size-14 items-center justify-center rounded-full bg-success-100 text-success-700">
          <CheckCircle2 className="size-7" aria-hidden />
        </span>
        <h2 className="mt-4 text-xl font-bold text-ink-950">Je staat op de lijst</h2>
        <p className="mt-2 max-w-sm text-ink-600">
          Bedankt! We laten je per e-mail weten wanneer er nieuws is. Uitschrijven kan altijd.
        </p>
      </div>
    );
  }

  const toggleCategory = (value: string) =>
    setCategories((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    run({
      type,
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      phone: String(form.get('phone') ?? ''),
      message: String(form.get('message') ?? ''),
      website: String(form.get('website') ?? ''),
      categories,
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <fieldset>
        <legend className="text-sm font-semibold text-ink-900">Ik schrijf me in als</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {TYPES.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer flex-col rounded-xl border p-4 transition-colors',
                type === option.value ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600' : 'border-ink-200 hover:border-ink-300',
              )}
            >
              <input
                type="radio"
                name="type"
                value={option.value}
                checked={type === option.value}
                onChange={() => setType(option.value)}
                className="sr-only"
              />
              <span className="text-xs font-medium text-ink-500">{option.hint}</span>
              <span className="font-bold text-ink-950">{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Naam" htmlFor="name" error={fieldErrors.name}>
          <Input {...fieldProps('name', fieldErrors.name)} autoComplete="name" required />
        </Field>
        <Field label="E-mailadres" htmlFor="email" error={fieldErrors.email}>
          <Input {...fieldProps('email', fieldErrors.email)} type="email" autoComplete="email" required />
        </Field>
      </div>
      <Field label="Telefoonnummer" htmlFor="phone" optional error={fieldErrors.phone}>
        <Input {...fieldProps('phone', fieldErrors.phone)} type="tel" autoComplete="tel" placeholder="+32 …" />
      </Field>

      {type === 'PROVIDER' && (
        <fieldset>
          <legend className="text-sm font-semibold text-ink-900">Welke diensten bied je aan?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORIES.map((category) => {
              const value = category.key ?? category.slug.toUpperCase();
              const selected = categories.includes(value);
              return (
                <label
                  key={value}
                  className={cn(
                    'cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600',
                    selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-200 text-ink-700 hover:border-ink-300',
                  )}
                >
                  <input type="checkbox" className="sr-only" checked={selected} onChange={() => toggleCategory(value)} />
                  {category.label}
                </label>
              );
            })}
          </div>
          {fieldErrors.categories && (
            <p role="alert" className="mt-2 text-sm font-medium text-danger-700">
              {fieldErrors.categories}
            </p>
          )}
        </fieldset>
      )}

      <Field label="Bericht" htmlFor="message" optional error={fieldErrors.message}>
        <Textarea {...fieldProps('message', fieldErrors.message)} rows={3} placeholder="Vertel gerust wat je zoekt of aanbiedt." />
      </Field>

      {/* Honeypot — hidden from people and assistive technology. */}
      <div className="hidden" aria-hidden>
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error && !Object.keys(fieldErrors).length && <Alert tone="danger">{error}</Alert>}

      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Zet me op de wachtlijst
      </Button>
      <p className="text-center text-xs leading-relaxed text-ink-500">
        We gebruiken je gegevens alleen om je op de hoogte te houden over Eventiphy. Lees onze{' '}
        <Link href="/privacy" className="font-semibold underline underline-offset-2">
          privacyverklaring
        </Link>
        .
      </p>
    </form>
  );
}

export { WaitlistForm };
