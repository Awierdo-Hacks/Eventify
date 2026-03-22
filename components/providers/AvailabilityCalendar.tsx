'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  addYears,
  subYears,
  eachDayOfInterval,
  isSameDay,
  isBefore,
  startOfDay,
  format,
} from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface AvailabilityCalendarProps {
  providerId: string;
  compact?: boolean;
}

export default function AvailabilityCalendar({ providerId, compact = false }: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const fetchAvailability = useCallback(async (month: Date) => {
    try {
      const from = startOfMonth(month).toISOString().split('T')[0];
      const to = endOfMonth(addMonths(month, 1)).toISOString().split('T')[0];

      const res = await fetch(`/api/providers/${providerId}/availability?from=${from}&to=${to}`);
      if (!res.ok) return;

      const data = await res.json();
      setUnavailableDates(data.unavailableDates || []);
    } catch {
      // Stil falen — de kalender toont gewoon alles als beschikbaar
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    fetchAvailability(currentMonth);
  }, [currentMonth, fetchAvailability]);

  const unavailableDateObjects = useMemo(
    () => unavailableDates.map((d) => new Date(d + 'T00:00:00')),
    [unavailableDates]
  );

  const isDateUnavailable = (date: Date) =>
    unavailableDateObjects.some((ud) => isSameDay(ud, date));

  const availableDateObjects = useMemo(() => {
    const today = startOfDay(new Date());
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    }).filter(
      (date) =>
        !isBefore(date, today) &&
        !unavailableDateObjects.some((ud) => isSameDay(ud, date))
    );
  }, [currentMonth, unavailableDateObjects]);

  const selectedIsUnavailable = selectedDate && isDateUnavailable(selectedDate);
  const selectedIsPast = selectedDate && isBefore(selectedDate, startOfDay(new Date()));

  // Navigatie
  const goToPrevMonth = () => setCurrentMonth((m) => subMonths(m, 1));
  const goToNextMonth = () => setCurrentMonth((m) => addMonths(m, 1));
  const goToPrevYear = () => setCurrentMonth((m) => subYears(m, 1));
  const goToNextYear = () => setCurrentMonth((m) => addYears(m, 1));
  const goToToday = () => setCurrentMonth(new Date());

  if (loading) {
    return <Skeleton className={`${compact ? 'h-64' : 'h-80'} w-full rounded-xl`} />;
  }

  return (
    <div>
      {/* Navigatie */}
      <div className={`flex items-center justify-between ${compact ? 'mb-1' : 'mb-2'}`}>
        <div className="flex items-center gap-0.5">
          <button
            onClick={goToPrevYear}
            className={`${compact ? 'p-0.5' : 'p-1'} rounded-lg hover:bg-gray-100 text-gray-500 transition-colors`}
            title="Vorig jaar"
          >
            <ChevronsLeft className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          </button>
          <button
            onClick={goToPrevMonth}
            className={`${compact ? 'p-0.5' : 'p-1'} rounded-lg hover:bg-gray-100 text-gray-500 transition-colors`}
            title="Vorige maand"
          >
            <ChevronLeft className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          </button>
        </div>
        <button
          onClick={goToToday}
          className="px-2 py-0.5 rounded-lg hover:bg-purple-50 text-xs font-medium text-purple-600 transition-colors"
        >
          Vandaag
        </button>
        <div className="flex items-center gap-0.5">
          <button
            onClick={goToNextMonth}
            className={`${compact ? 'p-0.5' : 'p-1'} rounded-lg hover:bg-gray-100 text-gray-500 transition-colors`}
            title="Volgende maand"
          >
            <ChevronRight className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          </button>
          <button
            onClick={goToNextYear}
            className={`${compact ? 'p-0.5' : 'p-1'} rounded-lg hover:bg-gray-100 text-gray-500 transition-colors`}
            title="Volgend jaar"
          >
            <ChevronsRight className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          </button>
        </div>
      </div>

      {/* Kalender */}
      <div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          hideNavigation
          fixedWeeks={!compact}
          className={compact ? 'p-1' : undefined}
          disabled={(date) => isBefore(date, startOfDay(new Date()))}
          modifiers={{
            unavailable: unavailableDateObjects,
            available: availableDateObjects,
          }}
          modifiersClassNames={{
            unavailable: '!bg-red-50 !text-red-400 !line-through',
            available: '!bg-green-50 !text-green-700',
          }}
          {...(compact ? {
            classNames: {
              months: 'flex flex-col gap-2 mx-auto',
              month: 'flex flex-col gap-2 w-full',
              month_caption: 'flex justify-center relative items-center',
              caption_label: 'text-xs font-semibold text-gray-900 capitalize',
              weekdays: 'flex justify-center',
              weekday: 'text-gray-600 rounded-md w-8 h-8 font-semibold text-[0.7rem] flex items-center justify-center',
              week: 'flex w-full mt-0.5 justify-center',
              day: 'relative p-0 text-center text-xs focus-within:relative focus-within:z-20',
              day_button: 'inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium text-gray-800 transition-colors hover:bg-purple-50 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1',
              selected: '!bg-purple-600 !text-white !font-semibold hover:!bg-purple-700 rounded-lg',
              today: 'border-2 border-purple-300 rounded-lg',
              outside: 'text-gray-400',
              disabled: '!text-gray-400 !cursor-not-allowed hover:!bg-transparent',
            },
          } : {})}
        />
      </div>

      {/* Feedback geselecteerde datum */}
      {selectedDate && !selectedIsPast && (
        <div className={`${compact ? 'mt-1 px-2 py-1.5' : 'mt-2 px-3 py-2'} rounded-xl flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'} ${
          selectedIsUnavailable
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {selectedIsUnavailable ? (
            <>
              <X className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} flex-shrink-0`} />
              <span>
                <strong>{format(selectedDate, 'd MMM', { locale: nl })}</strong> — Niet beschikbaar
              </span>
            </>
          ) : (
            <>
              <CheckCircle className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} flex-shrink-0`} />
              <span>
                <strong>{format(selectedDate, 'd MMM', { locale: nl })}</strong> — Beschikbaar
              </span>
            </>
          )}
        </div>
      )}

      {/* Legenda */}
      <div className={`flex gap-3 ${compact ? 'mt-1' : 'mt-3'} justify-center text-xs text-gray-500`}>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-green-50 border border-green-200" />
          Beschikbaar
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-red-50 border border-red-200" />
          Niet beschikbaar
        </div>
      </div>
    </div>
  );
}
