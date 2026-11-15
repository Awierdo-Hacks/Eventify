import type { Metadata } from 'next';
import Link from 'next/link';
import { SearchX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { BrowseFilters } from '@/features/providers/components/browse-filters';
import { ProviderCard } from '@/features/providers/components/provider-card';
import { searchProviders, type ProviderSort } from '@/features/providers/queries';
import { PRICE_RANGE_LABELS, findCategory, type PriceRangeKey } from '@/lib/catalog';
import { pluralize } from '@/lib/format';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

function readFilters(params: Record<string, string | string[] | undefined>) {
  return {
    q: first(params.q),
    category: first(params.category),
    location: first(params.location),
    price: first(params.price),
    sort: first(params.sort) as ProviderSort | undefined,
    page: Number(first(params.page)) || 1,
  };
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const filters = readFilters(await searchParams);
  const category = findCategory(filters.category);
  const where = filters.location ? ` in ${filters.location}` : '';
  const title = category ? `${category.label}${where}` : `Dienstverleners voor je event${where}`;
  const hasFilters = Boolean(filters.q || filters.price || filters.sort || filters.page > 1);
  return {
    title,
    description: category
      ? `Vergelijk ${category.label.toLowerCase()}${where} voor je evenement. Bekijk profielen en beoordelingen en vraag gratis offertes aan.`
      : 'Ontdek gecontroleerde dienstverleners voor je evenement. Filter op categorie, regio en prijsklasse en vraag gratis offertes aan.',
    alternates: { canonical: category ? `/browse?category=${category.slug}` : '/browse' },
    // Keep filtered and paginated variations out of the index.
    robots: hasFilters ? { index: false, follow: true } : undefined,
  };
}

export default async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const { items, total, totalPages, filters } = await searchProviders(readFilters(await searchParams));
  const category = findCategory(filters.category);

  const hrefWith = (changes: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    const merged = { ...filters, page: undefined as number | undefined, ...changes };
    for (const [key, value] of Object.entries(merged)) {
      if (value === undefined || value === '' || (key === 'sort' && value === 'recommended') || (key === 'page' && value === 1)) continue;
      params.set(key, String(value));
    }
    const query = params.toString();
    return query ? `/browse?${query}` : '/browse';
  };

  const chips = [
    filters.q && { label: `“${filters.q}”`, href: hrefWith({ q: undefined }) },
    category && { label: category.label, href: hrefWith({ category: undefined }) },
    filters.location && { label: filters.location, href: hrefWith({ location: undefined }) },
    filters.price && {
      label: PRICE_RANGE_LABELS[filters.price as PriceRangeKey].label,
      href: hrefWith({ price: undefined }),
    },
  ].filter((chip): chip is { label: string; href: string } => Boolean(chip));

  return (
    <div className="container-page py-8 sm:py-12">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-extrabold text-ink-950 sm:text-4xl">
          {category ? category.label : 'Vind de juiste dienstverleners'}
        </h1>
        <p className="mt-2 text-lg text-ink-600">
          {category ? `${category.description}. ` : ''}Bekijk profielen en vraag vrijblijvend een offerte aan.
        </p>
      </header>

      <div className="mt-6">
        <BrowseFilters key={JSON.stringify(filters)} values={filters} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink-700" aria-live="polite">
          {pluralize(total, 'dienstverlener', 'dienstverleners')} gevonden
        </p>
        {chips.length > 0 && (
          <ul className="flex flex-wrap items-center gap-2" aria-label="Actieve filters">
            {chips.map((chip) => (
              <li key={chip.label}>
                <Link
                  href={chip.href}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 py-1 pl-3 pr-2 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-200"
                  aria-label={`Filter ${chip.label} verwijderen`}
                >
                  {chip.label}
                  <X className="size-3.5" aria-hidden />
                </Link>
              </li>
            ))}
            <li>
              <Button asChild variant="link" size="sm">
                <Link href="/browse">Alles wissen</Link>
              </Button>
            </li>
          </ul>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={SearchX}
          title="Geen dienstverleners gevonden"
          description="Probeer een ruimere regio, een andere categorie of minder filters."
          action={
            <Button asChild variant="outline">
              <Link href="/browse">Filters wissen</Link>
            </Button>
          }
        />
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((provider, index) => (
            <li key={provider.id}>
              <ProviderCard provider={provider} priority={index < 3} />
            </li>
          ))}
        </ul>
      )}

      <Pagination className="mt-10" page={filters.page} totalPages={totalPages} hrefFor={(page) => hrefWith({ page })} />

      {/* Ranking transparency (EU consumer rules / P2B regulation). */}
      <details className="mt-10 rounded-xl border border-ink-200 bg-surface px-5 py-4 text-sm text-ink-600">
        <summary className="font-semibold text-ink-900">Hoe bepalen we de volgorde van de resultaten?</summary>
        <div className="mt-3 space-y-2 leading-relaxed">
          <p>
            Bij “Aanbevolen” staan dienstverleners met de hoogste gemiddelde beoordeling bovenaan. Bij een gelijke
            score telt het aantal beoordelingen, daarna hoe recent het profiel is aangemaakt.
          </p>
          <p>
            Dienstverleners kunnen niet betalen voor een hogere positie. Alleen profielen die door Eventiphy zijn
            nagekeken worden getoond. Beoordelingen komen uitsluitend van klanten met een afgeronde boeking.
          </p>
        </div>
      </details>
    </div>
  );
}
