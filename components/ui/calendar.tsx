'use client';

import { DayPicker, type DayPickerProps } from 'react-day-picker';
import { nl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CalendarProps = DayPickerProps & {
  className?: string;
};

export function Calendar({ className, classNames: classNameOverrides, ...props }: CalendarProps) {
  const defaultClassNames: Record<string, string> = {
    months: 'flex flex-col sm:flex-row gap-4',
    month: 'flex flex-col gap-4 w-full',
    month_caption: 'flex justify-center pt-1 relative items-center',
    caption_label: 'text-sm font-semibold text-gray-900 capitalize',
    nav: 'flex items-center gap-1',
    button_previous: 'absolute left-1 top-0 inline-flex items-center justify-center w-8 h-8 rounded-lg border-2 border-gray-100 bg-white hover:bg-purple-50 hover:border-purple-200 transition-colors',
    button_next: 'absolute right-1 top-0 inline-flex items-center justify-center w-8 h-8 rounded-lg border-2 border-gray-100 bg-white hover:bg-purple-50 hover:border-purple-200 transition-colors',
    weekdays: 'flex',
    weekday: 'text-gray-600 rounded-md w-10 h-10 font-semibold text-[0.8rem] flex items-center justify-center',
    week: 'flex w-full mt-1',
    day: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
    day_button: 'inline-flex items-center justify-center w-10 h-10 rounded-xl font-medium text-gray-800 transition-colors hover:bg-purple-50 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1',
    selected: '!bg-purple-600 !text-white !font-semibold hover:!bg-purple-700 rounded-xl',
    today: 'border-2 border-purple-300 rounded-xl',
    outside: 'text-gray-300',
    disabled: '!text-gray-300 !cursor-not-allowed hover:!bg-transparent',
    hidden: 'invisible',
  };

  return (
    <DayPicker
      locale={nl}
      showOutsideDays
      fixedWeeks
      className={cn('p-3', className)}
      classNames={{ ...defaultClassNames, ...classNameOverrides } as any}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-600" />
          ),
      }}
      {...props}
    />
  );
}
