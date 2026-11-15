import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Builds the href for a given page number. */
  hrefFor: (page: number) => string;
  className?: string;
}

function pageWindow(page: number, total: number): Array<number | 'gap'> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set([1, total, page - 1, page, page + 1].filter((value) => value >= 1 && value <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const result: Array<number | 'gap'> = [];
  sorted.forEach((value, index) => {
    const previous = sorted[index - 1];
    if (previous !== undefined && value - previous > 1) result.push('gap');
    result.push(value);
  });
  return result;
}

const linkClass =
  'flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-semibold transition-colors';

function Pagination({ page, totalPages, hrefFor, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Paginering" className={cn('flex items-center justify-center gap-1', className)}>
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={cn(linkClass, 'text-ink-700 hover:bg-ink-100')} aria-label="Vorige pagina" rel="prev">
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={cn(linkClass, 'text-ink-300')} aria-hidden>
          <ChevronLeft className="size-4" />
        </span>
      )}
      {pageWindow(page, totalPages).map((entry, index) =>
        entry === 'gap' ? (
          <span key={`gap-${index}`} className="px-1 text-ink-400" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={entry}
            href={hrefFor(entry)}
            aria-current={entry === page ? 'page' : undefined}
            className={cn(linkClass, entry === page ? 'bg-ink-950 text-white' : 'text-ink-700 hover:bg-ink-100')}
          >
            {entry}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={cn(linkClass, 'text-ink-700 hover:bg-ink-100')} aria-label="Volgende pagina" rel="next">
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={cn(linkClass, 'text-ink-300')} aria-hidden>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}

export { Pagination };
