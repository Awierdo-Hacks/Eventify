'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DayTone = 'default' | 'blocked' | 'booked' | 'external' | 'unavailable';

export interface DayInfo {
  tone?: DayTone;
  disabled?: boolean;
  /** Extra text for screen readers and the tooltip, e.g. "Geboekt". */
  label?: string;
}

interface MonthCalendarProps {
  /** Selected day keys (yyyy-MM-dd). */
  selected: string[];
  onSelect: (key: string) => void;
  /** Per-day state. Called for every visible day of the month. */
  dayInfo?: (key: string) => DayInfo | undefined;
  /** Days before this key cannot be selected. */
  minKey?: string;
  /** Called when the visible month changes (first day, yyyy-MM-dd). */
  onMonthChange?: (firstDayKey: string) => void;
  initialMonth?: string;
  className?: string;
}

const WEEKDAYS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
const MONTHS = [
  'januari',
  'februari',
  'maart',
  'april',
  'mei',
  'juni',
  'juli',
  'augustus',
  'september',
  'oktober',
  'november',
  'december',
];

const pad = (value: number) => String(value).padStart(2, '0');
export const dayKey = (year: number, month: number, day: number) =>
  `${year}-${pad(month + 1)}-${pad(day)}`;

export function todayKey(): string {
  const now = new Date();
  return dayKey(now.getFullYear(), now.getMonth(), now.getDate());
}

const toneClass: Record<DayTone, string> = {
  default: 'text-ink-900 hover:bg-brand-50',
  blocked: 'bg-ink-200 text-ink-700 hover:bg-ink-300',
  booked: 'bg-success-100 text-success-800',
  external: 'bg-info-100 text-info-800',
  unavailable: 'text-ink-300 line-through',
};

/** A plain month grid (weeks start on Monday) with selectable days. */
function MonthCalendar({
  selected,
  onSelect,
  dayInfo,
  minKey,
  onMonthChange,
  initialMonth,
  className,
}: MonthCalendarProps) {
  const [view, setView] = React.useState(() => {
    const base = initialMonth ? new Date(`${initialMonth}T00:00:00`) : new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  const move = (delta: number) => {
    const next = new Date(view.year, view.month + delta, 1);
    const nextView = { year: next.getFullYear(), month: next.getMonth() };
    setView(nextView);
    onMonthChange?.(dayKey(nextView.year, nextView.month, 1));
  };

  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const leading = (new Date(view.year, view.month, 1).getDay() + 6) % 7;
  const today = todayKey();
  const selectedSet = new Set(selected);
  const canGoBack = !minKey || dayKey(view.year, view.month, 1) > minKey;

  return (
    <div className={cn('select-none', className)}>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => move(-1)}
          disabled={!canGoBack}
          className="flex size-9 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 disabled:opacity-30"
          aria-label="Vorige maand"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <p className="text-sm font-bold capitalize text-ink-950" aria-live="polite">
          {MONTHS[view.month]} {view.year}
        </p>
        <button
          type="button"
          onClick={() => move(1)}
          className="flex size-9 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100"
          aria-label="Volgende maand"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>

      <div
        className="grid grid-cols-7 gap-1 text-center"
        role="group"
        aria-label={`${MONTHS[view.month]} ${view.year}`}
      >
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className="pb-1 text-xs font-semibold uppercase text-ink-500"
            aria-hidden
          >
            {weekday}
          </div>
        ))}
        {Array.from({ length: leading }, (_, index) => (
          <div key={`empty-${index}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const key = dayKey(view.year, view.month, day);
          const info = dayInfo?.(key);
          const isPast = Boolean(minKey && key < minKey);
          const disabled = isPast || info?.disabled;
          const isSelected = selectedSet.has(key);
          const tone = info?.tone ?? 'default';
          return (
            <div key={key}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(key)}
                aria-pressed={isSelected}
                aria-label={`${day} ${MONTHS[view.month]}${info?.label ? `, ${info.label}` : ''}`}
                title={info?.label}
                className={cn(
                  'relative flex aspect-square w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors',
                  isPast ? 'text-ink-300' : toneClass[tone],
                  disabled && 'cursor-not-allowed hover:bg-transparent',
                  disabled && tone !== 'default' && tone !== 'unavailable' && 'opacity-80',
                  isSelected && 'bg-brand-600 text-white hover:bg-brand-700',
                  key === today && !isSelected && 'ring-2 ring-inset ring-brand-400'
                )}
              >
                {day}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { MonthCalendar };
