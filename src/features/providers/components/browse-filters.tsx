'use client';

import Form from 'next/form';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { CATEGORIES, PRICE_RANGES, PRICE_RANGE_LABELS } from '@/lib/catalog';

interface BrowseFiltersProps {
  values: { q?: string; category?: string; location?: string; price?: string; sort: string };
}

/**
 * A plain GET form: works without JavaScript, is shareable as a URL, and is
 * enhanced to submit as soon as a dropdown changes.
 */
function BrowseFilters({ values }: BrowseFiltersProps) {
  const submitOnChange = (event: React.ChangeEvent<HTMLSelectElement>) => event.currentTarget.form?.requestSubmit();

  return (
    <Form
      action="/browse"
      role="search"
      aria-label="Dienstverleners filteren"
      className="grid gap-3 rounded-2xl border border-ink-200 bg-surface p-3 shadow-xs sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_0.9fr_0.9fr_auto]"
    >
      <div className="relative sm:col-span-2 lg:col-span-1">
        <label htmlFor="q" className="sr-only">
          Zoek op naam of trefwoord
        </label>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
        <Input id="q" name="q" type="search" defaultValue={values.q} placeholder="Naam of trefwoord" className="pl-10" />
      </div>
      <div>
        <label htmlFor="location" className="sr-only">
          Plaats of regio
        </label>
        <Input id="location" name="location" defaultValue={values.location} placeholder="Plaats of regio" />
      </div>
      <div>
        <label htmlFor="category" className="sr-only">
          Categorie
        </label>
        <Select id="category" name="category" defaultValue={values.category ?? ''} onChange={submitOnChange}>
          <option value="">Alle categorieën</option>
          {CATEGORIES.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label htmlFor="price" className="sr-only">
          Prijsklasse
        </label>
        <Select id="price" name="price" defaultValue={values.price ?? ''} onChange={submitOnChange}>
          <option value="">Elke prijsklasse</option>
          {PRICE_RANGES.map((range) => (
            <option key={range} value={range}>
              {PRICE_RANGE_LABELS[range].symbol} · {PRICE_RANGE_LABELS[range].label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label htmlFor="sort" className="sr-only">
          Sorteren
        </label>
        <Select id="sort" name="sort" defaultValue={values.sort} onChange={submitOnChange}>
          <option value="recommended">Aanbevolen</option>
          <option value="rating">Best beoordeeld</option>
          <option value="newest">Nieuwste</option>
        </Select>
      </div>
      <Button type="submit" className="h-11 sm:col-span-2 lg:col-span-1">
        Zoeken
      </Button>
    </Form>
  );
}

export { BrowseFilters };
