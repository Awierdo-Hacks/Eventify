import type { Metadata } from 'next';
import { SmartImage as Image } from '@/components/ui/smart-image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  ChevronRight,
  Clock,
  Flag,
  Globe,
  MapPin,
  Star,
  Users,
} from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { CategoryGlyph, CategoryIcon } from '@/components/ui/category-icon';
import { Stars } from '@/components/ui/stars';
import { site } from '@/config/site';
import { jsonLd } from '@/lib/json-ld';
import { ContactActions } from '@/features/providers/components/contact-actions';
import { ReviewList } from '@/features/providers/components/review-list';
import { getProviderProfile } from '@/features/providers/queries';
import {
  PRICE_RANGE_LABELS,
  categoryLabel,
  findCategory,
  priceRangeSymbol,
  type PriceRangeKey,
} from '@/lib/catalog';
import { formatMonthYear, formatPrice, pluralize } from '@/lib/format';
import { getCurrentUser } from '@/lib/session';

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const provider = await getProviderProfile(id);
  if (!provider || !provider.isPublic)
    return { title: 'Dienstverlener niet gevonden', robots: { index: false } };

  const title = `${provider.businessName} — ${categoryLabel(provider.category)} in ${provider.location}`;
  const description =
    provider.description?.slice(0, 155) ??
    `Bekijk het profiel van ${provider.businessName} en vraag gratis een offerte aan via ${site.name}.`;
  return {
    title,
    description,
    alternates: { canonical: `/providers/${provider.id}` },
    openGraph: {
      title,
      description,
      images: provider.gallery[0] ? [provider.gallery[0]] : undefined,
    },
  };
}

function safeWebsite(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.includes('://') ? url : `https://${url}`);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export default async function ProviderPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ slot?: string }>;
}) {
  const [{ id }, { slot: slotId }] = await Promise.all([params, searchParams]);
  const [provider, viewer] = await Promise.all([getProviderProfile(id), getCurrentUser()]);
  if (!provider) notFound();

  const isOwnProfile = viewer?.providerId === provider.id;
  // Hidden profiles are only visible to their owner and to admins.
  if (!provider.isPublic && !isOwnProfile && viewer?.role !== 'ADMIN') notFound();

  const category = findCategory(provider.category);
  const website = safeWebsite(provider.website);
  const [cover, ...rest] = provider.gallery;
  const totalReviews = provider.ratingDistribution.reduce((sum, entry) => sum + entry.count, 0);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: provider.businessName,
    description: provider.description ?? undefined,
    image: provider.gallery.slice(0, 5),
    url: `${site.url}/providers/${provider.id}`,
    address: { '@type': 'PostalAddress', addressLocality: provider.location, addressCountry: 'BE' },
    priceRange: priceRangeSymbol(provider.priceRange) || undefined,
    ...(totalReviews > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: provider.rating,
        reviewCount: totalReviews,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };

  const facts = [
    provider.minGuests || provider.maxGuests
      ? {
          icon: Users,
          label: 'Capaciteit',
          value:
            provider.minGuests && provider.maxGuests
              ? `${provider.minGuests}–${provider.maxGuests} gasten`
              : provider.maxGuests
                ? `Tot ${provider.maxGuests} gasten`
                : `Vanaf ${provider.minGuests} gasten`,
        }
      : null,
    provider.responseTime
      ? { icon: Clock, label: 'Reactietijd', value: provider.responseTime }
      : null,
    provider.availability
      ? { icon: CalendarDays, label: 'Beschikbaarheid', value: provider.availability }
      : null,
    { icon: Building2, label: 'Op Eventiphy sinds', value: formatMonthYear(provider.memberSince) },
  ].filter((fact) => fact !== null);

  return (
    <div className="container-page py-6 sm:py-10">
      {provider.isPublic && (
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structuredData)} />
      )}

      <nav aria-label="Kruimelpad" className="mb-5 flex items-center gap-1 text-sm text-ink-500">
        <Link href="/browse" className="hover:text-ink-900">
          Dienstverleners
        </Link>
        <ChevronRight className="size-4" aria-hidden />
        {category && (
          <>
            <Link href={`/browse?category=${category.slug}`} className="hover:text-ink-900">
              {category.label}
            </Link>
            <ChevronRight className="size-4" aria-hidden />
          </>
        )}
        <span className="truncate font-medium text-ink-900" aria-current="page">
          {provider.businessName}
        </span>
      </nav>

      {!provider.isPublic && (
        <Alert
          tone="warning"
          title="Dit profiel is nog niet zichtbaar voor klanten"
          className="mb-6"
        >
          {provider.verified
            ? 'Het profiel staat op verborgen.'
            : 'Ons team kijkt nieuwe profielen na voordat ze online komen. Je krijgt bericht zodra het zover is.'}
        </Alert>
      )}

      {/* Gallery */}
      {cover ? (
        <div
          className={`grid gap-2 overflow-hidden rounded-2xl ${rest.length > 0 ? 'sm:grid-cols-4 sm:grid-rows-2' : ''}`}
        >
          <div
            className={`relative aspect-[16/10] bg-ink-100 ${rest.length > 0 ? 'sm:col-span-2 sm:row-span-2 sm:aspect-auto' : 'max-h-[28rem] w-full'}`}
          >
            <Image
              src={cover}
              alt={`Foto van ${provider.businessName}`}
              fill
              priority
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          {rest.slice(0, 4).map((image, index) => (
            <div key={image} className="relative hidden aspect-[4/3] bg-ink-100 sm:block">
              <Image
                src={image}
                alt={`Portfolio van ${provider.businessName}, foto ${index + 2}`}
                fill
                sizes="25vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-44 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 via-brand-50 to-sun-100 text-brand-300 sm:h-56">
          <CategoryGlyph category={provider.category} className="size-16" strokeWidth={1.25} />
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-10">
          {/* Header */}
          <header>
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-brand-700">
              <CategoryIcon category={provider.category} size="sm" />
              {categoryLabel(provider.category)}
            </div>
            <h1 className="mt-3 flex flex-wrap items-center gap-2 text-3xl font-extrabold text-ink-950 sm:text-4xl">
              {provider.businessName}
              {provider.verified && (
                <BadgeCheck
                  className="size-7 text-brand-600"
                  aria-label="Geverifieerd door Eventiphy"
                />
              )}
            </h1>
            <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-600">
              <li className="flex items-center gap-1.5">
                <MapPin className="size-4 text-ink-400" aria-hidden />
                {provider.location}
              </li>
              <li className="flex items-center gap-1.5">
                {totalReviews > 0 ? (
                  <>
                    <Star
                      className="size-4 text-sun-400"
                      fill="currentColor"
                      strokeWidth={0}
                      aria-hidden
                    />
                    <span className="font-bold text-ink-950">
                      {provider.rating.toLocaleString('nl-BE', { minimumFractionDigits: 1 })}
                    </span>
                    <a
                      href="#beoordelingen"
                      className="underline underline-offset-2 hover:text-ink-900"
                    >
                      {pluralize(totalReviews, 'beoordeling', 'beoordelingen')}
                    </a>
                  </>
                ) : (
                  'Nog geen beoordelingen'
                )}
              </li>
              {priceRangeSymbol(provider.priceRange) && (
                <li>
                  <span className="font-bold text-ink-950">
                    {priceRangeSymbol(provider.priceRange)}
                  </span>{' '}
                  {PRICE_RANGE_LABELS[provider.priceRange as PriceRangeKey]?.label}
                </li>
              )}
            </ul>
          </header>

          {provider.description && (
            <section aria-labelledby="about-title">
              <h2 id="about-title" className="text-xl font-bold text-ink-950">
                Over {provider.businessName}
              </h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-700">
                {provider.description}
              </p>
              {provider.tags.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {provider.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full bg-ink-100 px-3 py-1 text-sm font-medium text-ink-800"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {provider.services.length > 0 && (
            <section aria-labelledby="services-title">
              <h2 id="services-title" className="text-xl font-bold text-ink-950">
                Diensten en richtprijzen
              </h2>
              <ul className="mt-4 divide-y divide-ink-100 rounded-xl border border-ink-200 bg-surface">
                {provider.services.map((service) => (
                  <li
                    key={service.id}
                    className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1 p-4 sm:p-5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-ink-950">{service.name}</p>
                      {service.description && (
                        <p className="mt-1 text-sm leading-relaxed text-ink-600">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 font-bold text-ink-950">
                      {service.priceTo
                        ? `${formatPrice(service.priceFrom)} – ${formatPrice(service.priceTo)}`
                        : `vanaf ${formatPrice(service.priceFrom)}`}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-ink-500">
                Richtprijzen opgegeven door de dienstverlener. De definitieve prijs staat in je
                offerte.
              </p>
            </section>
          )}

          <section id="beoordelingen" className="scroll-mt-24" aria-labelledby="reviews-title">
            <h2 id="reviews-title" className="text-xl font-bold text-ink-950">
              Beoordelingen
            </h2>
            {totalReviews === 0 ? (
              <p className="mt-3 text-ink-600">
                Deze dienstverlener heeft nog geen beoordelingen ontvangen.
              </p>
            ) : (
              <div className="mt-4 rounded-xl border border-ink-200 bg-surface p-5 sm:p-6">
                <div className="grid gap-6 border-b border-ink-100 pb-6 sm:grid-cols-[auto_1fr] sm:gap-10">
                  <div className="text-center sm:text-left">
                    <p className="text-5xl font-extrabold text-ink-950">
                      {provider.rating.toLocaleString('nl-BE', { minimumFractionDigits: 1 })}
                    </p>
                    <Stars rating={provider.rating} size="md" className="mt-2" />
                    <p className="mt-1 text-sm text-ink-600">
                      {pluralize(totalReviews, 'beoordeling', 'beoordelingen')}
                    </p>
                  </div>
                  <ul className="space-y-1.5" aria-label="Verdeling van de beoordelingen">
                    {provider.ratingDistribution.map((entry) => (
                      <li
                        key={entry.stars}
                        className="flex items-center gap-3 text-sm text-ink-600"
                      >
                        <span className="w-3 font-semibold text-ink-900">{entry.stars}</span>
                        <span
                          className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100"
                          aria-hidden
                        >
                          <span
                            className="block h-full rounded-full bg-sun-400"
                            style={{ width: `${(entry.count / totalReviews) * 100}%` }}
                          />
                        </span>
                        <span className="w-6 text-right tabular-nums">{entry.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-6">
                  <ReviewList reviews={provider.reviews} />
                </div>
              </div>
            )}
            <p className="mt-3 text-xs leading-relaxed text-ink-500">
              Beoordelingen kunnen alleen geplaatst worden door klanten met een afgeronde boeking
              bij deze dienstverlener via Eventiphy. We passen ze niet aan en tonen positieve en
              negatieve beoordelingen op dezelfde manier.
            </p>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-ink-200 bg-surface p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-ink-950">
              Interesse in {provider.businessName}?
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-600">
              Vertel wat je plant en ontvang een offerte op maat.
            </p>
            <div className="mt-5">
              <ContactActions
                providerId={provider.id}
                providerUserId={provider.userId}
                viewerRole={viewer?.role ?? null}
                isOwnProfile={isOwnProfile}
                slotId={slotId?.slice(0, 40)}
              />
            </div>
          </div>

          <dl className="divide-y divide-ink-100 rounded-2xl border border-ink-200 bg-surface px-5 sm:px-6">
            {facts.map((fact) => (
              <div key={fact.label} className="flex items-start gap-3 py-4">
                <fact.icon className="mt-0.5 size-5 shrink-0 text-ink-400" aria-hidden />
                <div className="min-w-0">
                  <dt className="text-xs font-medium text-ink-500">{fact.label}</dt>
                  <dd className="text-sm font-semibold text-ink-900">{fact.value}</dd>
                </div>
              </div>
            ))}
            {website && (
              <div className="flex items-start gap-3 py-4">
                <Globe className="mt-0.5 size-5 shrink-0 text-ink-400" aria-hidden />
                <div className="min-w-0">
                  <dt className="text-xs font-medium text-ink-500">Website</dt>
                  <dd className="truncate text-sm font-semibold">
                    <a
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-brand-700 hover:underline"
                    >
                      {new URL(website).hostname.replace(/^www\./, '')}
                    </a>
                  </dd>
                </div>
              </div>
            )}
          </dl>

          <div className="space-y-2 px-1 text-xs leading-relaxed text-ink-500">
            <p>
              Deze dienstverlener handelt als professional (onderneming). Je sluit de overeenkomst
              rechtstreeks met de dienstverlener; het consumentenrecht is daarop van toepassing.
            </p>
            <Link
              href={`/melden?type=PROVIDER&id=${provider.id}`}
              className="inline-flex items-center gap-1.5 font-semibold text-ink-600 underline underline-offset-2 hover:text-ink-900"
            >
              <Flag className="size-3.5" aria-hidden /> Dit profiel melden
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
