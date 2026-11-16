import 'server-only';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import { TAGS } from '@/lib/cache';
import { DEMO_EMAIL_SUFFIX, isDemoEnabled } from '@/features/demo/config';
import { categoryStoredValues, PRICE_RANGES, type PriceRangeKey } from '@/lib/catalog';
import type { Prisma } from '@/generated/prisma/client';

export const PROVIDERS_PAGE_SIZE = 12;

export type ProviderSort = 'recommended' | 'rating' | 'newest';

export interface ProviderFilters {
  q?: string;
  category?: string;
  location?: string;
  price?: string;
  sort?: ProviderSort;
  page?: number;
}

export interface ProviderCardData {
  id: string;
  businessName: string;
  category: string;
  location: string;
  priceRange: string;
  description: string | null;
  image: string | null;
  rating: number;
  reviewCount: number;
}

const cardSelect = {
  id: true,
  business_name: true,
  category: true,
  location: true,
  price_range: true,
  description: true,
  images: true,
  rating_avg: true,
  review_count: true,
} satisfies Prisma.ServiceProviderSelect;

type CardRow = Prisma.ServiceProviderGetPayload<{ select: typeof cardSelect }>;

function toCard(row: CardRow): ProviderCardData {
  return {
    id: row.id,
    businessName: row.business_name,
    category: row.category,
    location: row.location,
    priceRange: row.price_range,
    description: row.description,
    image: row.images[0] ?? null,
    rating: Math.round(row.rating_avg * 10) / 10,
    reviewCount: row.review_count,
  };
}

/** Cached results are kept apart per mode, so switching demo mode off takes effect at once. */
const CACHE_SCOPE = isDemoEnabled() ? 'demo' : 'live';

/**
 * Only verified, visible providers of non-deleted accounts are public. Demo
 * providers are public only while demo mode is on, so sample businesses never
 * show up on the real site.
 */
const PUBLIC_WHERE = {
  verified: true,
  is_active: true,
  user: {
    status: 'ACTIVE',
    deleted_at: null,
    ...(isDemoEnabled() ? {} : { NOT: { email: { endsWith: DEMO_EMAIL_SUFFIX } } }),
  },
} satisfies Prisma.ServiceProviderWhereInput;

/**
 * How results are ordered (disclosed to visitors on the browse page):
 * recommended = average rating, then number of reviews, then newest.
 * Providers cannot pay for a higher position.
 */
const ORDER: Record<ProviderSort, Prisma.ServiceProviderOrderByWithRelationInput[]> = {
  recommended: [{ rating_avg: 'desc' }, { review_count: 'desc' }, { created_at: 'desc' }],
  rating: [{ rating_avg: 'desc' }, { review_count: 'desc' }],
  newest: [{ created_at: 'desc' }],
};

export function normalizeFilters(filters: ProviderFilters) {
  const sort: ProviderSort = filters.sort && filters.sort in ORDER ? filters.sort : 'recommended';
  const price = PRICE_RANGES.includes(filters.price as PriceRangeKey)
    ? (filters.price as PriceRangeKey)
    : undefined;
  return {
    q: filters.q?.trim().slice(0, 80) || undefined,
    category: filters.category?.trim().slice(0, 40) || undefined,
    location: filters.location?.trim().slice(0, 80) || undefined,
    price,
    sort,
    page: Math.max(1, Math.min(500, Math.floor(filters.page ?? 1) || 1)),
  };
}

const searchCached = unstable_cache(
  async (key: string) => {
    const filters = JSON.parse(key) as ReturnType<typeof normalizeFilters>;
    const where: Prisma.ServiceProviderWhereInput = {
      ...PUBLIC_WHERE,
      ...(filters.category && { category: { in: categoryStoredValues(filters.category) } }),
      ...(filters.location && { location: { contains: filters.location, mode: 'insensitive' } }),
      ...(filters.price && { price_range: filters.price }),
      ...(filters.q && {
        OR: [
          { business_name: { contains: filters.q, mode: 'insensitive' } },
          { description: { contains: filters.q, mode: 'insensitive' } },
          { location: { contains: filters.q, mode: 'insensitive' } },
        ],
      }),
    };

    const [rows, total] = await Promise.all([
      db.serviceProvider.findMany({
        where,
        select: cardSelect,
        orderBy: ORDER[filters.sort],
        skip: (filters.page - 1) * PROVIDERS_PAGE_SIZE,
        take: PROVIDERS_PAGE_SIZE,
      }),
      db.serviceProvider.count({ where }),
    ]);

    return { items: rows.map(toCard), total };
  },
  ['providers-search', CACHE_SCOPE],
  { tags: [TAGS.providers], revalidate: 300 }
);

export async function searchProviders(filters: ProviderFilters) {
  const normalized = normalizeFilters(filters);
  const result = await searchCached(JSON.stringify(normalized));
  return {
    ...result,
    filters: normalized,
    totalPages: Math.max(1, Math.ceil(result.total / PROVIDERS_PAGE_SIZE)),
  };
}

export const getFeaturedProviders = unstable_cache(
  async (limit: number): Promise<ProviderCardData[]> => {
    const rows = await db.serviceProvider.findMany({
      where: PUBLIC_WHERE,
      select: cardSelect,
      orderBy: ORDER.recommended,
      take: limit,
    });
    return rows.map(toCard);
  },
  ['providers-featured', CACHE_SCOPE],
  { tags: [TAGS.providers], revalidate: 600 }
);

/** Number of public providers per stored category value. */
export const getCategoryCounts = unstable_cache(
  async (): Promise<Record<string, number>> => {
    const groups = await db.serviceProvider.groupBy({
      by: ['category'],
      where: PUBLIC_WHERE,
      _count: { _all: true },
    });
    return Object.fromEntries(groups.map((group) => [group.category, group._count._all]));
  },
  ['providers-category-counts', CACHE_SCOPE],
  { tags: [TAGS.providers], revalidate: 600 }
);

export const getPublicProviderIds = unstable_cache(
  async () =>
    db.serviceProvider.findMany({
      where: PUBLIC_WHERE,
      select: { id: true, updated_at: true },
      orderBy: { updated_at: 'desc' },
      take: 5000,
    }),
  ['providers-ids', CACHE_SCOPE],
  { tags: [TAGS.providers], revalidate: 3600 }
);

const profileCached = unstable_cache(
  async (id: string) => {
    const provider = await db.serviceProvider.findUnique({
      where: { id },
      select: {
        id: true,
        user_id: true,
        business_name: true,
        category: true,
        location: true,
        price_range: true,
        description: true,
        services: true,
        images: true,
        portfolio_images: true,
        website: true,
        availability: true,
        min_guests: true,
        max_guests: true,
        response_time: true,
        verified: true,
        is_active: true,
        btw_number: true,
        rating_avg: true,
        review_count: true,
        created_at: true,
        user: { select: { status: true, deleted_at: true, email: true } },
        provider_services: {
          select: { id: true, name: true, description: true, price_from: true, price_to: true },
          orderBy: { created_at: 'asc' },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            title: true,
            comment: true,
            event_type: true,
            created_at: true,
            customer: { select: { first_name: true, name: true, deleted_at: true } },
          },
          orderBy: { created_at: 'desc' },
          take: 30,
        },
        _count: { select: { bookings: { where: { status: 'COMPLETED' } } } },
      },
    });
    if (!provider) return null;

    const distribution = await db.review.groupBy({
      by: ['rating'],
      where: { provider_id: id },
      _count: { _all: true },
    });

    const gallery = [...new Set([...provider.images, ...provider.portfolio_images])];

    return {
      id: provider.id,
      userId: provider.user_id,
      businessName: provider.business_name,
      category: provider.category,
      location: provider.location,
      priceRange: provider.price_range,
      description: provider.description,
      tags: provider.services,
      gallery,
      website: provider.website,
      availability: provider.availability,
      minGuests: provider.min_guests,
      maxGuests: provider.max_guests,
      responseTime: provider.response_time,
      isPublic:
        provider.verified &&
        provider.is_active &&
        provider.user.status === 'ACTIVE' &&
        !provider.user.deleted_at &&
        (isDemoEnabled() || !provider.user.email.endsWith(DEMO_EMAIL_SUFFIX)),
      verified: provider.verified,
      hasEnterpriseNumber: Boolean(provider.btw_number),
      rating: Math.round(provider.rating_avg * 10) / 10,
      reviewCount: provider.review_count,
      completedBookings: provider._count.bookings,
      memberSince: provider.created_at.toISOString(),
      services: provider.provider_services.map((service) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        priceFrom: service.price_from,
        priceTo: service.price_to,
      })),
      reviews: provider.reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        eventType: review.event_type,
        createdAt: review.created_at.toISOString(),
        // First name only: enough to feel real, not enough to identify someone.
        author: review.customer.deleted_at
          ? 'Voormalig gebruiker'
          : review.customer.first_name || review.customer.name.split(' ')[0] || 'Klant',
      })),
      ratingDistribution: [5, 4, 3, 2, 1].map((stars) => ({
        stars,
        count: distribution.find((entry) => entry.rating === stars)?._count._all ?? 0,
      })),
    };
  },
  ['provider-profile', CACHE_SCOPE],
  { tags: [TAGS.providers], revalidate: 300 }
);

export type ProviderProfile = NonNullable<Awaited<ReturnType<typeof profileCached>>>;

export async function getProviderProfile(id: string) {
  return profileCached(id);
}

/** Days a provider cannot be booked: blocked, already booked, or busy in a synced calendar. */
export async function getUnavailableDates(
  providerId: string,
  from: Date,
  to: Date
): Promise<string[]> {
  const [blocked, bookings, external] = await Promise.all([
    db.blockedDate.findMany({
      where: { provider_id: providerId, date: { gte: from, lte: to } },
      select: { date: true },
    }),
    db.booking.findMany({
      where: {
        provider_id: providerId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        event_date: { gte: from, lte: to },
      },
      select: { event_date: true },
    }),
    db.externalCalendarEvent.findMany({
      where: {
        integration: { provider_id: providerId, is_active: true },
        start_date: { gte: from, lte: to },
      },
      select: { start_date: true },
    }),
  ]);

  const days = new Set<string>();
  for (const row of blocked) days.add(row.date.toISOString().slice(0, 10));
  for (const row of bookings) days.add(row.event_date.toISOString().slice(0, 10));
  for (const row of external) days.add(row.start_date.toISOString().slice(0, 10));
  return [...days].sort();
}
