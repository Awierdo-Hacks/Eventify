import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarsProps {
  rating: number;
  size?: 'sm' | 'md';
  className?: string;
}

/** Five stars with fractional fill, plus an accessible label. */
function Stars({ rating, size = 'sm', className }: StarsProps) {
  const clamped = Math.max(0, Math.min(5, rating));
  const iconSize = size === 'sm' ? 'size-3.5' : 'size-5';
  return (
    <span
      className={cn('inline-flex items-center gap-0.5', className)}
      role="img"
      aria-label={`${clamped.toLocaleString('nl-BE', { maximumFractionDigits: 1 })} van 5 sterren`}
    >
      {[0, 1, 2, 3, 4].map((index) => {
        const fill = Math.max(0, Math.min(1, clamped - index));
        return (
          <span key={index} className={cn('relative inline-block', iconSize)}>
            <Star
              className={cn('absolute inset-0 text-ink-200', iconSize)}
              fill="currentColor"
              strokeWidth={0}
              aria-hidden
            />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star
                className={cn('text-sun-400', iconSize)}
                fill="currentColor"
                strokeWidth={0}
                aria-hidden
              />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export { Stars };
