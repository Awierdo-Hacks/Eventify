'use client';

import * as React from 'react';
import Link from 'next/link';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, fieldProps } from '@/components/ui/field';
import { Checkbox, Input, Select, Textarea } from '@/components/ui/input';
import { useAction } from '@/hooks/use-action';
import { CATEGORIES, PRICE_RANGES, PRICE_RANGE_LABELS } from '@/lib/catalog';
import { registerCustomerAction, registerProviderAction } from '@/features/auth/actions';
import { PasswordInput } from '@/features/auth/components/password-input';
import { LEGAL_DOCUMENTS } from '@/features/legal/documents';

const text = (form: FormData, key: string) => String(form.get(key) ?? '');

function ConsentCheckbox({
  id,
  error,
  children,
}: {
  id: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          name={id}
          className="mt-0.5"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <label htmlFor={id} className="text-sm leading-relaxed text-ink-700">
          {children}
        </label>
      </div>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 pl-8 text-sm font-medium text-danger-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}

const legalLink = 'font-semibold text-brand-700 underline underline-offset-2';

function PrivacyNotice() {
  return (
    <p className="text-center text-xs leading-relaxed text-ink-500">
      We verwerken je gegevens om je account te beheren en de dienst te leveren. Hoe we dat doen
      lees je in onze{' '}
      <Link
        href={LEGAL_DOCUMENTS.privacy.href}
        target="_blank"
        className="font-semibold underline underline-offset-2"
      >
        privacyverklaring
      </Link>
      .
    </p>
  );
}

export function CustomerRegisterForm() {
  const { run, pending, error, fieldErrors } = useAction(registerCustomerAction, {
    toastError: false,
  });

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    run({
      firstName: text(form, 'firstName'),
      lastName: text(form, 'lastName'),
      email: text(form, 'email'),
      dateOfBirth: text(form, 'dateOfBirth'),
      password: text(form, 'password'),
      acceptTerms: (form.get('acceptTerms') === 'on') as true,
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {error && !Object.keys(fieldErrors).length && <Alert tone="danger">{error}</Alert>}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Voornaam" htmlFor="firstName" error={fieldErrors.firstName}>
          <Input
            {...fieldProps('firstName', fieldErrors.firstName)}
            autoComplete="given-name"
            required
          />
        </Field>
        <Field label="Achternaam" htmlFor="lastName" error={fieldErrors.lastName}>
          <Input
            {...fieldProps('lastName', fieldErrors.lastName)}
            autoComplete="family-name"
            required
          />
        </Field>
      </div>
      <Field label="E-mailadres" htmlFor="email" error={fieldErrors.email}>
        <Input
          {...fieldProps('email', fieldErrors.email)}
          type="email"
          autoComplete="email"
          required
        />
      </Field>
      <Field
        label="Geboortedatum"
        htmlFor="dateOfBirth"
        error={fieldErrors.dateOfBirth}
        hint="Je moet minstens 18 jaar zijn om afspraken te maken met dienstverleners."
      >
        <Input
          {...fieldProps('dateOfBirth', fieldErrors.dateOfBirth, true)}
          type="date"
          autoComplete="bday"
          required
        />
      </Field>
      <Field
        label="Wachtwoord"
        htmlFor="password"
        error={fieldErrors.password}
        hint="Minstens 8 tekens."
      >
        <PasswordInput
          {...fieldProps('password', fieldErrors.password, true)}
          autoComplete="new-password"
          required
        />
      </Field>

      <ConsentCheckbox id="acceptTerms" error={fieldErrors.acceptTerms}>
        Ik ga akkoord met de{' '}
        <Link href={LEGAL_DOCUMENTS['terms-customer'].href} target="_blank" className={legalLink}>
          gebruiksvoorwaarden voor klanten
        </Link>
        .
      </ConsentCheckbox>

      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Account aanmaken
      </Button>
      <PrivacyNotice />
    </form>
  );
}

export function ProviderRegisterForm() {
  const { run, pending, error, fieldErrors } = useAction(registerProviderAction, {
    toastError: false,
  });
  const [description, setDescription] = React.useState('');

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    run({
      contactName: text(form, 'contactName'),
      email: text(form, 'email'),
      phone: text(form, 'phone'),
      password: text(form, 'password'),
      businessName: text(form, 'businessName'),
      category: text(form, 'category'),
      location: text(form, 'location'),
      priceRange: text(form, 'priceRange') as (typeof PRICE_RANGES)[number],
      description,
      btwNumber: text(form, 'btwNumber'),
      acceptTerms: (form.get('acceptTerms') === 'on') as true,
      confirmProfessional: (form.get('confirmProfessional') === 'on') as true,
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate>
      {error && !Object.keys(fieldErrors).length && <Alert tone="danger">{error}</Alert>}

      <fieldset className="space-y-5">
        <legend className="text-xs font-bold uppercase tracking-wider text-ink-500">
          1 · Je bedrijf
        </legend>
        <Field label="Bedrijfsnaam" htmlFor="businessName" error={fieldErrors.businessName}>
          <Input
            {...fieldProps('businessName', fieldErrors.businessName)}
            autoComplete="organization"
            required
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Categorie" htmlFor="category" error={fieldErrors.category}>
            <Select {...fieldProps('category', fieldErrors.category)} defaultValue="" required>
              <option value="" disabled>
                Kies een categorie
              </option>
              {CATEGORIES.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Prijsklasse" htmlFor="priceRange" error={fieldErrors.priceRange}>
            <Select
              {...fieldProps('priceRange', fieldErrors.priceRange)}
              defaultValue="MEDIUM"
              required
            >
              {PRICE_RANGES.map((range) => (
                <option key={range} value={range}>
                  {PRICE_RANGE_LABELS[range].symbol} · {PRICE_RANGE_LABELS[range].label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Stad of regio" htmlFor="location" error={fieldErrors.location}>
          <Input
            {...fieldProps('location', fieldErrors.location)}
            placeholder="bv. Antwerpen"
            required
          />
        </Field>
        <Field
          label="Beschrijving"
          htmlFor="description"
          error={fieldErrors.description}
          hint={`Vertel wat je doet en wat je onderscheidt. ${description.trim().length}/50 tekens minimaal.`}
        >
          <Textarea
            {...fieldProps('description', fieldErrors.description, true)}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            maxLength={2000}
            required
          />
        </Field>
        <Field
          label="Ondernemingsnummer"
          htmlFor="btwNumber"
          optional
          error={fieldErrors.btwNumber}
          hint="Helpt ons je profiel sneller te verifiëren. Wordt niet publiek getoond."
        >
          <Input
            {...fieldProps('btwNumber', fieldErrors.btwNumber, true)}
            placeholder="BE 0123.456.789"
          />
        </Field>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="text-xs font-bold uppercase tracking-wider text-ink-500">
          2 · Je account
        </legend>
        <Field label="Naam contactpersoon" htmlFor="contactName" error={fieldErrors.contactName}>
          <Input
            {...fieldProps('contactName', fieldErrors.contactName)}
            autoComplete="name"
            required
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="E-mailadres" htmlFor="email" error={fieldErrors.email}>
            <Input
              {...fieldProps('email', fieldErrors.email)}
              type="email"
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Telefoonnummer" htmlFor="phone" error={fieldErrors.phone}>
            <Input
              {...fieldProps('phone', fieldErrors.phone)}
              type="tel"
              autoComplete="tel"
              placeholder="+32 …"
              required
            />
          </Field>
        </div>
        <Field
          label="Wachtwoord"
          htmlFor="password"
          error={fieldErrors.password}
          hint="Minstens 8 tekens."
        >
          <PasswordInput
            {...fieldProps('password', fieldErrors.password, true)}
            autoComplete="new-password"
            required
          />
        </Field>
      </fieldset>

      <div className="space-y-3">
        <ConsentCheckbox id="confirmProfessional" error={fieldErrors.confirmProfessional}>
          Ik bied mijn diensten aan als professional (onderneming) en beschik over de nodige
          vergunningen en verzekeringen.
        </ConsentCheckbox>
        <ConsentCheckbox id="acceptTerms" error={fieldErrors.acceptTerms}>
          Ik ga akkoord met de{' '}
          <Link href={LEGAL_DOCUMENTS['terms-provider'].href} target="_blank" className={legalLink}>
            voorwaarden voor dienstverleners
          </Link>
          .
        </ConsentCheckbox>
      </div>

      <div className="space-y-4">
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          Profiel aanmaken
        </Button>
        <p className="text-center text-sm text-ink-600">
          Foto’s en diensten voeg je in de volgende stap toe. Je profiel wordt zichtbaar na controle
          door ons team.
        </p>
        <PrivacyNotice />
      </div>
    </form>
  );
}
