/**
 * Shared vocabulary: categories, event types, price ranges and status labels.
 * Pure data — safe to import from both server and client components.
 */

export const CATEGORY_KEYS = [
  'CATERING',
  'MUSIC',
  'PHOTOGRAPHY',
  'DECORATION',
  'VENUE',
  'ENTERTAINMENT',
  'VIDEOGRAPHY',
  'TRANSPORT',
  'ACCOMMODATION',
  'SECURITY',
  'SANITARY',
  'CAKE',
  'FLOWERS',
  'MC',
  'OTHER',
] as const;
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export interface Category {
  /** Enum value used by event slots. `null` for provider-only categories. */
  key: CategoryKey | null;
  /** Value stored in `service_providers.category` and used in URLs. */
  slug: string;
  /** Other stored spellings that mean the same category (v1 data). */
  aliases?: string[];
  label: string;
  /** Name for a single provider in this category. */
  singular: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  { key: 'VENUE', slug: 'venues', aliases: ['venue'], label: 'Locaties & zalen', singular: 'Locatie', description: 'Feestzalen, lofts en buitenlocaties' },
  { key: 'CATERING', slug: 'catering', label: 'Catering', singular: 'Cateraar', description: 'Van walking dinner tot foodtruck' },
  { key: 'MUSIC', slug: 'dj', aliases: ['music'], label: 'DJ & muziek', singular: 'DJ of band', description: 'Dj’s, bands en live muzikanten' },
  { key: 'PHOTOGRAPHY', slug: 'photography', label: 'Fotografie', singular: 'Fotograaf', description: 'Reportages en portretten' },
  { key: 'VIDEOGRAPHY', slug: 'video', aliases: ['videography'], label: 'Videografie', singular: 'Videograaf', description: 'Aftermovies en trouwfilms' },
  { key: 'DECORATION', slug: 'decoration', label: 'Decoratie & styling', singular: 'Decorateur', description: 'Aankleding, licht en styling' },
  { key: 'FLOWERS', slug: 'flowers', label: 'Bloemen', singular: 'Bloemist', description: 'Boeketten en bloemdecoratie' },
  { key: 'ENTERTAINMENT', slug: 'entertainment', label: 'Entertainment', singular: 'Entertainer', description: 'Acts, goochelaars en animatie' },
  { key: 'CAKE', slug: 'cake', label: 'Taart & patisserie', singular: 'Patissier', description: 'Bruidstaarten en sweet tables' },
  { key: 'MC', slug: 'mc', label: 'Ceremoniemeester', singular: 'Ceremoniemeester', description: 'Presentatie en begeleiding' },
  { key: 'TRANSPORT', slug: 'transport', label: 'Vervoer', singular: 'Vervoerder', description: 'Trouwauto’s en shuttles' },
  { key: 'ACCOMMODATION', slug: 'accommodation', label: 'Accommodatie', singular: 'Accommodatie', description: 'Overnachting voor gasten' },
  { key: 'SECURITY', slug: 'security', label: 'Beveiliging', singular: 'Beveiliger', description: 'Bewaking en crowd control' },
  { key: 'SANITARY', slug: 'sanitary', label: 'Sanitair', singular: 'Sanitairverhuurder', description: 'Toiletwagens en voorzieningen' },
  { key: null, slug: 'planning', label: 'Eventplanning', singular: 'Eventplanner', description: 'Organisatie van A tot Z' },
  { key: 'OTHER', slug: 'other', label: 'Overig', singular: 'Dienstverlener', description: 'Al het andere voor je event' },
];

/** Categories shown first on the home page. */
export const FEATURED_CATEGORY_SLUGS = ['venues', 'catering', 'dj', 'photography', 'decoration', 'entertainment', 'flowers', 'video'];

const bySlug = new Map<string, Category>();
const byKey = new Map<string, Category>();
for (const category of CATEGORIES) {
  bySlug.set(category.slug, category);
  for (const alias of category.aliases ?? []) bySlug.set(alias, category);
  if (category.key) byKey.set(category.key, category);
}

/** Resolve a stored provider category string (any v1 spelling or enum value). */
export function findCategory(value: string | null | undefined): Category | undefined {
  if (!value) return undefined;
  return bySlug.get(value.toLowerCase()) ?? byKey.get(value.toUpperCase());
}

export function categoryLabel(value: string | null | undefined): string {
  return findCategory(value)?.label ?? value ?? 'Onbekend';
}

export function categoryByKey(key: string): Category {
  return byKey.get(key) ?? byKey.get('OTHER')!;
}

/** Every stored spelling for a category, for database filters. */
export function categoryStoredValues(slug: string): string[] {
  const category = bySlug.get(slug);
  if (!category) return [slug];
  return [category.slug, ...(category.aliases ?? []), ...(category.key ? [category.key] : [])];
}

// ─── Price ranges ──────────────────────────────────────────────────────────

export const PRICE_RANGES = ['LOW', 'MEDIUM', 'HIGH', 'PREMIUM'] as const;
export type PriceRangeKey = (typeof PRICE_RANGES)[number];

export const PRICE_RANGE_LABELS: Record<PriceRangeKey, { symbol: string; label: string }> = {
  LOW: { symbol: '€', label: 'Budget' },
  MEDIUM: { symbol: '€€', label: 'Gemiddeld' },
  HIGH: { symbol: '€€€', label: 'Premium' },
  PREMIUM: { symbol: '€€€€', label: 'Luxe' },
};

export function priceRangeSymbol(value: string | null | undefined): string {
  return PRICE_RANGE_LABELS[value as PriceRangeKey]?.symbol ?? '';
}

// ─── Event types & templates ───────────────────────────────────────────────

export const EVENT_TYPES = ['WEDDING', 'BIRTHDAY', 'CORPORATE', 'FESTIVAL', 'CUSTOM'] as const;
export type EventTypeKey = (typeof EVENT_TYPES)[number];

export interface EventTemplate {
  label: string;
  description: string;
  requiredSlots: CategoryKey[];
  optionalSlots: CategoryKey[];
}

export const EVENT_TEMPLATES: Record<EventTypeKey, EventTemplate> = {
  WEDDING: {
    label: 'Bruiloft',
    description: 'Alle leveranciers voor jullie grote dag',
    requiredSlots: ['VENUE', 'CATERING', 'MUSIC', 'PHOTOGRAPHY', 'DECORATION'],
    optionalSlots: ['MC', 'VIDEOGRAPHY', 'TRANSPORT', 'ACCOMMODATION', 'FLOWERS', 'CAKE'],
  },
  BIRTHDAY: {
    label: 'Verjaardag',
    description: 'Van intiem diner tot groot feest',
    requiredSlots: ['VENUE', 'CATERING', 'ENTERTAINMENT'],
    optionalSlots: ['DECORATION', 'PHOTOGRAPHY', 'CAKE'],
  },
  CORPORATE: {
    label: 'Zakelijk event',
    description: 'Teamdag, receptie of productlancering',
    requiredSlots: ['VENUE', 'CATERING'],
    optionalSlots: ['PHOTOGRAPHY', 'ENTERTAINMENT'],
  },
  FESTIVAL: {
    label: 'Festival',
    description: 'Een groot of openbaar evenement',
    requiredSlots: ['VENUE', 'MUSIC', 'SECURITY', 'CATERING'],
    optionalSlots: ['DECORATION', 'SANITARY'],
  },
  CUSTOM: {
    label: 'Eigen samenstelling',
    description: 'Begin leeg en kies zelf wat je nodig hebt',
    requiredSlots: [],
    optionalSlots: [],
  },
};

/** Event types offered when requesting a quote (stored as free text in v1). */
export const REQUEST_EVENT_TYPES = ['Bruiloft', 'Verjaardag', 'Zakelijk event', 'Festival', 'Babyshower', 'Jubileum', 'Anders'];

export function eventTypeLabel(value: string | null | undefined): string {
  if (!value) return 'Evenement';
  return EVENT_TEMPLATES[value as EventTypeKey]?.label ?? value;
}

// ─── Status labels ─────────────────────────────────────────────────────────

export type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'brand';

export interface StatusMeta {
  label: string;
  tone: Tone;
}

export const SLOT_STATUS: Record<string, StatusMeta> = {
  EMPTY: { label: 'Nog in te vullen', tone: 'neutral' },
  SEARCHING: { label: 'Aan het zoeken', tone: 'info' },
  QUOTES_REQUESTED: { label: 'Wacht op offertes', tone: 'warning' },
  QUOTES_RECEIVED: { label: 'Offertes ontvangen', tone: 'brand' },
  BOOKED: { label: 'Vastgelegd', tone: 'success' },
};

export const EVENT_STATUS: Record<string, StatusMeta> = {
  PLANNING: { label: 'In planning', tone: 'info' },
  ACTIVE: { label: 'Actief', tone: 'success' },
  COMPLETED: { label: 'Afgerond', tone: 'neutral' },
  CANCELLED: { label: 'Geannuleerd', tone: 'danger' },
};

export const REQUEST_STATUS: Record<string, StatusMeta> = {
  PENDING: { label: 'In afwachting', tone: 'warning' },
  QUOTED: { label: 'Offerte ontvangen', tone: 'brand' },
  ACCEPTED: { label: 'Geaccepteerd', tone: 'success' },
  REJECTED: { label: 'Afgewezen', tone: 'danger' },
  CANCELLED: { label: 'Geannuleerd', tone: 'neutral' },
};

export const QUOTE_STATUS: Record<string, StatusMeta> = {
  PENDING: { label: 'Openstaand', tone: 'warning' },
  ACCEPTED: { label: 'Geaccepteerd', tone: 'success' },
  REJECTED: { label: 'Afgewezen', tone: 'danger' },
  EXPIRED: { label: 'Verlopen', tone: 'neutral' },
};

/**
 * "CONFIRMED" is shown as "Vastgelegd" rather than "Geboekt": a booking is an
 * agreement between customer and provider, not a payment.
 */
export const BOOKING_STATUS: Record<string, StatusMeta> = {
  PENDING: { label: 'In afwachting', tone: 'warning' },
  CONFIRMED: { label: 'Vastgelegd', tone: 'success' },
  COMPLETED: { label: 'Afgerond', tone: 'neutral' },
  CANCELLED: { label: 'Geannuleerd', tone: 'danger' },
};

export const USER_STATUS: Record<string, StatusMeta> = {
  ACTIVE: { label: 'Actief', tone: 'success' },
  SUSPENDED: { label: 'Geschorst', tone: 'warning' },
  BANNED: { label: 'Verbannen', tone: 'danger' },
};

export const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: 'Klant',
  PROVIDER: 'Dienstverlener',
  ADMIN: 'Beheerder',
};

export type QuoteStatusKey = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

/** Quotes have no status column: it is derived from these three fields. */
export function quoteStatus(quote: { accepted: boolean; rejected_at: Date | null; valid_until: Date }): QuoteStatusKey {
  if (quote.accepted) return 'ACCEPTED';
  if (quote.rejected_at) return 'REJECTED';
  if (quote.valid_until.getTime() < Date.now()) return 'EXPIRED';
  return 'PENDING';
}
