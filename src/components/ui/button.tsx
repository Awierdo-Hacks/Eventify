import * as React from 'react';
import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150 select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:shadow-glow',
        gradient: 'bg-brand-gradient text-white shadow-sm hover:shadow-glow hover:brightness-105',
        dark: 'bg-ink-950 text-white shadow-sm hover:bg-ink-800',
        secondary: 'bg-brand-50 text-brand-800 hover:bg-brand-100',
        outline: 'border border-ink-200 bg-surface text-ink-900 shadow-xs hover:border-ink-300 hover:bg-ink-50',
        ghost: 'text-ink-700 hover:bg-ink-100 hover:text-ink-950',
        danger: 'bg-danger-600 text-white shadow-sm hover:bg-danger-700',
        'danger-outline': 'border border-danger-100 bg-surface text-danger-700 hover:bg-danger-50',
        link: 'h-auto rounded-sm p-0 text-brand-700 underline-offset-4 hover:underline active:scale-100',
      },
      size: {
        sm: 'h-9 px-3 text-sm [&_svg]:size-4',
        md: 'h-10 px-4 text-sm [&_svg]:size-4',
        lg: 'h-12 px-6 text-base [&_svg]:size-5',
        icon: 'size-10 [&_svg]:size-5',
        'icon-sm': 'size-8 [&_svg]:size-4',
      },
    },
    compoundVariants: [{ variant: 'link', className: 'h-auto px-0' }],
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render the child element (e.g. a Link) with button styling. */
  asChild?: boolean;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
}

function Button({ className, variant, size, asChild, loading, disabled, children, type, ...props }: ButtonProps) {
  if (asChild) {
    return (
      <Slot.Root className={cn(buttonVariants({ variant, size }), className)} {...props}>
        {children}
      </Slot.Root>
    );
  }
  return (
    <button
      type={type ?? 'button'}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export { Button, buttonVariants };
