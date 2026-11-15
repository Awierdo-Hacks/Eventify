import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FilterTabsProps {
  tabs: Array<{ href: string; label: string; count?: number; active: boolean }>;
  label: string;
}

/** Link-based tabs: each filter is its own URL and loads only its own data. */
function FilterTabs({ tabs, label }: FilterTabsProps) {
  return (
    <nav aria-label={label} className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-ink-100 p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? 'page' : undefined}
          className={cn(
            'flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
            tab.active ? 'bg-surface text-ink-950 shadow-xs' : 'text-ink-600 hover:text-ink-950',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn('rounded-full px-1.5 text-xs tabular-nums', tab.active ? 'bg-brand-100 text-brand-800' : 'bg-ink-200 text-ink-600')}>
              {tab.count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

export { FilterTabs };
