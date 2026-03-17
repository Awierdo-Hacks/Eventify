import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
  gradient?: boolean;
}

export function PageHeader({ title, subtitle, children, className, gradient = false }: PageHeaderProps) {
  return (
    <div className={cn('mb-6 md:mb-12', className)}>
      <h1 className={cn(
        'text-2xl sm:text-3xl md:text-4xl font-bold mb-4',
        gradient && 'gradient-text'
      )}>
        {title}
      </h1>
      {subtitle && (
        <p className="text-xl md:text-2xl text-gray-600">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}
