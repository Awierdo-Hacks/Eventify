import { useId } from 'react';
import { cn } from '@/lib/utils';
import { site } from '@/config/site';

/** The Eventiphy pin mark. */
function LogoMark({ className }: { className?: string }) {
  const gradientId = useId();
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" className={cn('size-8', className)} aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="40%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <path d="M16 2C10.5 2 6 6.2 6 11.2C6 18.5 16 30 16 30S26 18.5 26 11.2C26 6.2 21.5 2 16 2Z" fill={`url(#${gradientId})`} />
      <path d="M16 6 L17.5 11 L22 12.5 L17.5 14 L16 19 L14.5 14 L10 12.5 L14.5 11 Z" fill="white" />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  /** Use on dark backgrounds. */
  inverted?: boolean;
  markOnly?: boolean;
}

function Logo({ className, inverted, markOnly }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      {!markOnly && (
        <span className={cn('text-xl font-extrabold tracking-tight', inverted ? 'text-white' : 'text-ink-950')}>
          {site.name}
        </span>
      )}
    </span>
  );
}

export { Logo, LogoMark };
