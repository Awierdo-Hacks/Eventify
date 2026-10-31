import type { ProviderCategory } from '@/generated/prisma/client/enums';

/**
 * The single list of service categories used everywhere: registration,
 * profiles, browse, event slots and the waitlist. Values are the
 * ProviderCategory enum from the database.
 */
export interface CategoryInfo {
  value: ProviderCategory;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { value: 'VENUE', label: 'Locaties & Zalen', shortLabel: 'Locatie', icon: '🏛️', description: 'Feestzaal, restaurant of buitenlocatie' },
  { value: 'CATERING', label: 'Catering & Food', shortLabel: 'Catering', icon: '🍽️', description: 'Eten en drinken voor je gasten' },
  { value: 'MUSIC', label: 'DJ & Muziek', shortLabel: 'Muziek', icon: '🎵', description: 'DJ, band of live muziek' },
  { value: 'PHOTOGRAPHY', label: 'Fotografie', shortLabel: 'Fotografie', icon: '📸', description: 'Professionele fotograaf' },
  { value: 'VIDEOGRAPHY', label: 'Videografie', shortLabel: 'Video', icon: '🎥', description: 'Videograaf voor je event' },
  { value: 'DECORATION', label: 'Decoratie & Styling', shortLabel: 'Decoratie', icon: '✨', description: 'Aankleding en styling' },
  { value: 'FLOWERS', label: 'Bloemen & Arrangementen', shortLabel: 'Bloemen', icon: '💐', description: 'Bloemstukken en boeketten' },
  { value: 'CAKE', label: 'Taart & Desserts', shortLabel: 'Taart', icon: '🎂', description: 'Taart en desserts' },
  { value: 'ENTERTAINMENT', label: 'Entertainment', shortLabel: 'Entertainment', icon: '🎭', description: 'Artiesten, animatie en shows' },
  { value: 'MC', label: 'Ceremoniemeester & Presentatie', shortLabel: 'MC', icon: '🎤', description: 'Presentator of ceremoniemeester' },
  { value: 'TRANSPORT', label: 'Transport', shortLabel: 'Transport', icon: '🚗', description: 'Vervoer voor gasten of het bruidspaar' },
  { value: 'ACCOMMODATION', label: 'Overnachting', shortLabel: 'Overnachting', icon: '🏨', description: 'Hotel of overnachting voor gasten' },
  { value: 'SECURITY', label: 'Beveiliging', shortLabel: 'Beveiliging', icon: '🛡️', description: 'Beveiliging en toegangscontrole' },
  { value: 'SANITARY', label: 'Sanitair', shortLabel: 'Sanitair', icon: '🚻', description: 'Toiletwagens en sanitaire voorzieningen' },
  { value: 'OTHER', label: 'Overige diensten', shortLabel: 'Overig', icon: '📋', description: 'Andere diensten, zoals eventplanning' },
];

export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value) as [ProviderCategory, ...ProviderCategory[]];

const BY_VALUE = new Map<string, CategoryInfo>(CATEGORIES.map((c) => [c.value, c]));

// Old free-text values (before the enum migration) and URL slugs
const LEGACY_SLUGS: Record<string, ProviderCategory> = {
  catering: 'CATERING',
  dj: 'MUSIC',
  music: 'MUSIC',
  photography: 'PHOTOGRAPHY',
  decoration: 'DECORATION',
  venues: 'VENUE',
  venue: 'VENUE',
  entertainment: 'ENTERTAINMENT',
  video: 'VIDEOGRAPHY',
  videography: 'VIDEOGRAPHY',
  transport: 'TRANSPORT',
  accommodation: 'ACCOMMODATION',
  security: 'SECURITY',
  sanitary: 'SANITARY',
  cake: 'CAKE',
  flowers: 'FLOWERS',
  mc: 'MC',
  planning: 'OTHER',
  other: 'OTHER',
};

/** Parses an enum value or a legacy slug ("dj", "video") into a category. */
export function parseCategory(value: string | null | undefined): ProviderCategory | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (BY_VALUE.has(trimmed.toUpperCase())) return trimmed.toUpperCase() as ProviderCategory;
  return LEGACY_SLUGS[trimmed.toLowerCase()] ?? null;
}

export function getCategory(value: string | null | undefined): CategoryInfo | null {
  const parsed = parseCategory(value);
  return parsed ? BY_VALUE.get(parsed) ?? null : null;
}

export function categoryLabel(value: string | null | undefined, short = false): string {
  const info = getCategory(value);
  if (!info) return value || 'Onbekend';
  return short ? info.shortLabel : info.label;
}

export function categoryIcon(value: string | null | undefined): string {
  return getCategory(value)?.icon ?? '📋';
}
