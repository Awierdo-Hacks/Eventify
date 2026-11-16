import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  hint?: string;
  href?: string;
  /** Draws attention when something needs action. */
  highlight?: boolean;
}

function StatCard({ label, value, icon: Icon, hint, href, highlight }: StatCardProps) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink-600">{label}</p>
        <span
          className={cn(
            'flex size-9 items-center justify-center rounded-lg',
            highlight ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600'
          )}
        >
          <Icon className="size-[1.125rem]" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-3xl font-extrabold tabular-nums text-ink-950">{value}</p>
      {hint && <p className="mt-1 text-sm text-ink-500">{hint}</p>}
    </>
  );
  const className = cn(
    'block rounded-xl border bg-surface p-5 shadow-xs',
    highlight ? 'border-brand-300 ring-1 ring-brand-200' : 'border-ink-200',
    href && 'transition-[box-shadow,border-color] hover:border-ink-300 hover:shadow-sm'
  );
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export { StatCard };
