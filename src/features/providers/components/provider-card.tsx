import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, MapPin, Star } from 'lucide-react';
import { CategoryGlyph } from '@/components/ui/category-icon';
import { categoryLabel, priceRangeSymbol } from '@/lib/catalog';
import type { ProviderCardData } from '@/features/providers/queries';

interface ProviderCardProps {
  provider: ProviderCardData;
  /** Load eagerly for cards above the fold. */
  priority?: boolean;
  /** Event slot the customer is searching for (carried to the quote request). */
  slotId?: string;
}

function ProviderCard({ provider, priority, slotId }: ProviderCardProps) {
  return (
    <Link
      href={slotId ? `/providers/${provider.id}?slot=${encodeURIComponent(slotId)}` : `/providers/${provider.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-200 bg-surface shadow-xs transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-brand-100 via-brand-50 to-sun-100">
        {provider.image ? (
          <Image
            src={provider.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            priority={priority}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-brand-300">
            <CategoryGlyph category={provider.category} className="size-14" strokeWidth={1.25} />
          </span>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-surface/95 px-2.5 py-1 text-xs font-semibold text-ink-900 shadow-xs backdrop-blur">
          <CategoryGlyph category={provider.category} className="size-3.5 text-brand-600" />
          {categoryLabel(provider.category)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="flex min-w-0 items-center gap-1.5 text-base font-bold text-ink-950">
            <span className="truncate">{provider.businessName}</span>
            <BadgeCheck className="size-4 shrink-0 text-brand-600" aria-label="Geverifieerd" />
          </h3>
          {provider.reviewCount > 0 ? (
            <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-ink-950">
              <Star className="size-4 text-sun-400" fill="currentColor" strokeWidth={0} aria-hidden />
              {provider.rating.toLocaleString('nl-BE', { minimumFractionDigits: 1 })}
              <span className="font-medium text-ink-500">({provider.reviewCount})</span>
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-sun-100 px-2 py-0.5 text-xs font-semibold text-sun-800">Nieuw</span>
          )}
        </div>
        {provider.description && <p className="line-clamp-2 text-sm leading-relaxed text-ink-600">{provider.description}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2 text-sm text-ink-600">
          <span className="flex min-w-0 items-center gap-1.5">
            <MapPin className="size-4 shrink-0 text-ink-400" aria-hidden />
            <span className="truncate">{provider.location}</span>
          </span>
          <span className="shrink-0 font-semibold tracking-wide text-ink-900" aria-label={`Prijsklasse ${priceRangeSymbol(provider.priceRange).length} van 4`}>
            {priceRangeSymbol(provider.priceRange)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export { ProviderCard };
