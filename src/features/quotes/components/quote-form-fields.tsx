'use client';

import * as React from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input, Select, Textarea } from '@/components/ui/input';

export interface QuoteDraft {
  totalPrice: string;
  title: string;
  includedServices: string[];
  terms: string;
  validDays: string;
}

export const emptyQuoteDraft = (): QuoteDraft => ({
  totalPrice: '',
  title: '',
  includedServices: [''],
  terms: '',
  validDays: '14',
});

interface QuoteFormFieldsProps {
  draft: QuoteDraft;
  onChange: (draft: QuoteDraft) => void;
  errors: Record<string, string>;
}

/** The fields of a quote, shared by the dashboard dialog and the chat dialog. */
function QuoteFormFields({ draft, onChange, errors }: QuoteFormFieldsProps) {
  const set = <K extends keyof QuoteDraft>(key: K, value: QuoteDraft[K]) =>
    onChange({ ...draft, [key]: value });
  const setService = (index: number, value: string) =>
    set(
      'includedServices',
      draft.includedServices.map((item, itemIndex) => (itemIndex === index ? value : item))
    );

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-[1fr_10rem]">
        <Field label="Omschrijving" htmlFor="quote-title" error={errors.title}>
          <Input
            id="quote-title"
            value={draft.title}
            onChange={(event) => set('title', event.target.value)}
            maxLength={200}
            placeholder="bv. Walking dinner voor 80 gasten"
            aria-invalid={errors.title ? true : undefined}
          />
        </Field>
        <Field label="Totaalprijs (€)" htmlFor="quote-price" error={errors.totalPrice}>
          <Input
            id="quote-price"
            type="number"
            min={1}
            step="0.01"
            inputMode="decimal"
            value={draft.totalPrice}
            onChange={(event) => set('totalPrice', event.target.value)}
            placeholder="750"
            aria-invalid={errors.totalPrice ? true : undefined}
          />
        </Field>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-ink-900">Wat is inbegrepen?</legend>
        <ul className="mt-2 space-y-2">
          {draft.includedServices.map((service, index) => (
            <li key={index} className="flex gap-2">
              <Input
                value={service}
                onChange={(event) => setService(index, event.target.value)}
                maxLength={160}
                placeholder={index === 0 ? 'bv. Opbouw en afbouw' : 'Nog een onderdeel'}
                aria-label={`Inbegrepen dienst ${index + 1}`}
              />
              {draft.includedServices.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 shrink-0"
                  onClick={() =>
                    set(
                      'includedServices',
                      draft.includedServices.filter((_, itemIndex) => itemIndex !== index)
                    )
                  }
                  aria-label={`Dienst ${index + 1} verwijderen`}
                >
                  <X aria-hidden />
                </Button>
              )}
            </li>
          ))}
        </ul>
        {errors.includedServices && (
          <p role="alert" className="mt-1.5 text-sm font-medium text-danger-700">
            {errors.includedServices}
          </p>
        )}
        {draft.includedServices.length < 25 && (
          <Button
            variant="link"
            size="sm"
            className="mt-2"
            onClick={() => set('includedServices', [...draft.includedServices, ''])}
          >
            <Plus aria-hidden /> Regel toevoegen
          </Button>
        )}
      </fieldset>

      <Field
        label="Voorwaarden"
        htmlFor="quote-terms"
        optional
        hint="bv. voorschot, annulering, wat niet inbegrepen is."
      >
        <Textarea
          id="quote-terms"
          value={draft.terms}
          onChange={(event) => set('terms', event.target.value)}
          rows={3}
          maxLength={2000}
          aria-describedby="quote-terms-hint"
        />
      </Field>

      <Field label="Geldigheid" htmlFor="quote-valid">
        <Select
          id="quote-valid"
          value={draft.validDays}
          onChange={(event) => set('validDays', event.target.value)}
          className="sm:w-48"
        >
          <option value="7">7 dagen</option>
          <option value="14">14 dagen</option>
          <option value="30">30 dagen</option>
          <option value="60">60 dagen</option>
        </Select>
      </Field>
    </div>
  );
}

export { QuoteFormFields };
