import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
  className?: string;
  background?: 'gradient-hero' | 'gradient-feature' | 'gradient-card' | 'white';
}

export function Section({ children, className, background = 'white' }: SectionProps) {
  return (
    <section className={cn(
      'py-20',
      background !== 'white' && background,
      className
    )}>
      {children}
    </section>
  );
}
