import * as React from 'react';
import { cn } from '@/lib/utils';

export const controlClass =
  'w-full rounded-lg border border-ink-200 bg-surface px-3.5 text-[0.9375rem] text-ink-950 shadow-xs transition-[border-color,box-shadow] placeholder:text-ink-400 hover:border-ink-300 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-500 aria-[invalid=true]:border-danger-600 aria-[invalid=true]:focus:ring-danger-600/15';

function Input({
  className,
  type = 'text',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type={type} className={cn(controlClass, 'h-11', className)} {...props} />;
}

function Textarea({
  className,
  rows = 4,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      className={cn(controlClass, 'min-h-24 resize-y py-2.5 leading-relaxed', className)}
      {...props}
    />
  );
}

function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        controlClass,
        'h-11 appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10',
        "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%237c7488%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')]",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

function Checkbox({
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return (
    <input
      type="checkbox"
      className={cn(
        'size-[1.125rem] shrink-0 cursor-pointer rounded-[5px] border border-ink-300 bg-surface accent-brand-600 transition-colors checked:border-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export { Input, Textarea, Select, Checkbox };
