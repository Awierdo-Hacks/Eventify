import * as React from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const tones = {
  info: { className: 'border-info-100 bg-info-50 text-info-800', icon: Info },
  success: { className: 'border-success-100 bg-success-50 text-success-800', icon: CheckCircle2 },
  warning: { className: 'border-sun-200 bg-sun-50 text-sun-800', icon: TriangleAlert },
  danger: { className: 'border-danger-100 bg-danger-50 text-danger-800', icon: AlertCircle },
} as const;

interface AlertProps {
  tone?: keyof typeof tones;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

function Alert({ tone = 'info', title, children, className }: AlertProps) {
  const { className: toneClass, icon: Icon } = tones[tone];
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-lg border px-4 py-3 text-sm', toneClass, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 space-y-0.5">
        {title && <p className="font-bold">{title}</p>}
        {children && <div className="leading-relaxed">{children}</div>}
      </div>
    </div>
  );
}

export { Alert };
