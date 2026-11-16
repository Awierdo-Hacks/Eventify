const LOCALE = 'nl-BE';
const TIME_ZONE = 'Europe/Brussels';

const currency = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});
const currencyExact = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'EUR' });
const dateLong = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'long', timeZone: TIME_ZONE });
const dateMedium = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeZone: TIME_ZONE });
const dateWeekday = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: TIME_ZONE,
});
const time = new Intl.DateTimeFormat(LOCALE, { timeStyle: 'short', timeZone: TIME_ZONE });
const monthYear = new Intl.DateTimeFormat(LOCALE, {
  month: 'long',
  year: 'numeric',
  timeZone: TIME_ZONE,
});
const relative = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });
const number = new Intl.NumberFormat(LOCALE);

type DateInput = Date | string | number;
const toDate = (value: DateInput) => (value instanceof Date ? value : new Date(value));

/** €1.250 — whole euros unless the amount has cents. */
export function formatPrice(amount: number): string {
  return Number.isInteger(amount) ? currency.format(amount) : currencyExact.format(amount);
}

export const formatNumber = (value: number) => number.format(value);
export const formatDate = (value: DateInput) => dateLong.format(toDate(value));
export const formatDateShort = (value: DateInput) => dateMedium.format(toDate(value));
export const formatDateWeekday = (value: DateInput) => dateWeekday.format(toDate(value));
export const formatTime = (value: DateInput) => time.format(toDate(value));
export const formatMonthYear = (value: DateInput) => monthYear.format(toDate(value));

/** "vandaag", "gisteren", "3 dagen geleden", "over 2 weken", … */
export function formatRelative(value: DateInput, now: Date = new Date()): string {
  const diffMs = toDate(value).getTime() - now.getTime();
  const abs = Math.abs(diffMs);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (abs < minute) return 'zojuist';
  if (abs < hour) return relative.format(Math.round(diffMs / minute), 'minute');
  if (abs < day) return relative.format(Math.round(diffMs / hour), 'hour');
  if (abs < 30 * day) return relative.format(Math.round(diffMs / day), 'day');
  if (abs < 365 * day) return relative.format(Math.round(diffMs / (30 * day)), 'month');
  return relative.format(Math.round(diffMs / (365 * day)), 'year');
}

/** Chat timestamps: time today, weekday this week, date otherwise. */
export function formatChatTime(value: DateInput, now: Date = new Date()): string {
  const date = toDate(value);
  const sameDay = dateMedium.format(date) === dateMedium.format(now);
  if (sameDay) return time.format(date);
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays < 7) {
    return new Intl.DateTimeFormat(LOCALE, { weekday: 'short', timeZone: TIME_ZONE }).format(date);
  }
  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'short',
    timeZone: TIME_ZONE,
  }).format(date);
}

/** yyyy-MM-dd for a calendar day, independent of the server time zone. */
export function toDateKey(value: DateInput): string {
  return toDate(value).toISOString().slice(0, 10);
}

/** Parse a yyyy-MM-dd key as a UTC midnight date (matches @db.Date storage). */
export function fromDateKey(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}
