import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { StatusMeta } from '@/lib/catalog';

const badgeVariants = cva(
  'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold [&_svg]:size-3.5',
  {
    variants: {
      tone: {
        neutral: 'bg-ink-100 text-ink-700',
        brand: 'bg-brand-100 text-brand-800',
        info: 'bg-info-100 text-info-800',
        success: 'bg-success-100 text-success-800',
        warning: 'bg-sun-100 text-sun-800',
        danger: 'bg-danger-100 text-danger-800',
        outline: 'border border-ink-200 bg-surface text-ink-700',
      },
    },
    defaultVariants: { tone: 'neutral' },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

/** Badge for a status looked up in one of the catalog status maps. */
function StatusBadge({
  status,
  map,
  className,
}: {
  status: string;
  map: Record<string, StatusMeta>;
  className?: string;
}) {
  const meta = map[status] ?? { label: status, tone: 'neutral' as const };
  return (
    <Badge tone={meta.tone} className={className}>
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {meta.label}
    </Badge>
  );
}

export { Badge, StatusBadge, badgeVariants };
