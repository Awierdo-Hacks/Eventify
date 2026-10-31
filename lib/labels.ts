/**
 * Dutch display labels for database values, so raw enum/slug values
 * ("wedding", "MEDIUM", "CONFIRMED") never reach the screen.
 */

function lookup(map: Record<string, string>, value: string | null | undefined, fallback = '—'): string {
  if (!value) return fallback;
  return map[value] ?? map[value.toUpperCase()] ?? map[value.toLowerCase()] ?? value;
}

const PRICE_RANGE_LABELS: Record<string, string> = {
  LOW: '€ · Budget',
  MEDIUM: '€€ · Gemiddeld',
  HIGH: '€€€ · Premium',
  PREMIUM: '€€€€ · Luxe',
};

const PRICE_RANGE_SYMBOLS: Record<string, string> = {
  LOW: '€',
  MEDIUM: '€€',
  HIGH: '€€€',
  PREMIUM: '€€€€',
};

export const priceRangeLabel = (value: string | null | undefined) => lookup(PRICE_RANGE_LABELS, value, 'Niet opgegeven');
export const priceRangeSymbol = (value: string | null | undefined) => lookup(PRICE_RANGE_SYMBOLS, value, '');

// Event types: enum values from the event builder and older lowercase slugs from quote requests
const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: 'Bruiloft',
  BIRTHDAY: 'Verjaardag',
  CORPORATE: 'Zakelijk event',
  FESTIVAL: 'Festival',
  CUSTOM: 'Ander event',
  wedding: 'Bruiloft',
  birthday: 'Verjaardag',
  corporate: 'Zakelijk event',
  festival: 'Festival',
  party: 'Feest',
  anniversary: 'Jubileum',
  communion: 'Communie',
  babyshower: 'Babyshower',
  other: 'Ander event',
  'Via Chat': 'Via chat',
};

export const eventTypeLabel = (value: string | null | undefined) => lookup(EVENT_TYPE_LABELS, value, 'Event');

const REQUEST_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Nieuw',
  QUOTED: 'Offerte ontvangen',
  ACCEPTED: 'Geaccepteerd',
  REJECTED: 'Afgewezen door provider',
  CANCELLED: 'Geannuleerd',
};

export const requestStatusLabel = (value: string | null | undefined) => lookup(REQUEST_STATUS_LABELS, value);

const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: 'In afwachting',
  CONFIRMED: 'Bevestigd',
  COMPLETED: 'Voltooid',
  CANCELLED: 'Geannuleerd',
};

export const bookingStatusLabel = (value: string | null | undefined) => lookup(BOOKING_STATUS_LABELS, value);

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: 'Nog niet betaald',
  PENDING: 'Betaling bezig',
  PAID: 'Betaald',
  FAILED: 'Betaling mislukt',
  CANCELLED: 'Betaling geannuleerd',
  EXPIRED: 'Betaling verlopen',
  REFUNDED: 'Terugbetaald',
};

export const paymentStatusLabel = (value: string | null | undefined) => lookup(PAYMENT_STATUS_LABELS, value);

export function formatEuro(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
}
