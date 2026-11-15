import * as React from 'react';
import { cn } from '@/lib/utils';

function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('block text-sm font-semibold text-ink-900', className)} {...props} />;
}

interface FieldProps {
  label: string;
  /** Must match the `id` of the control inside. */
  htmlFor: string;
  error?: string;
  hint?: React.ReactNode;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Label + control + hint + error. Pass the same id to the control and set
 * `aria-describedby={`${id}-hint`}` / `aria-invalid` on it via `fieldProps`.
 */
function Field({ label, htmlFor, error, hint, optional, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {optional && <span className="text-xs text-ink-500">Optioneel</span>}
      </div>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-sm font-medium text-danger-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-sm text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Accessibility attributes for a control inside a `Field`. */
function fieldProps(id: string, error?: string, hasHint?: boolean) {
  return {
    id,
    name: id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : hasHint ? `${id}-hint` : undefined,
  } as const;
}

export { Label, Field, fieldProps };
