/**
 * Reusable Confirmation Dialog System
 * Base component for all confirmation dialogs in the application
 */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { Button } from './button';
import { Badge } from './badge';
import { X, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ============================================================================
 * BASE CONFIRMATION DIALOG COMPONENT (Foundation)
 * ============================================================================ */

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = '2xl',
}: ConfirmationDialogProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        maxWidthClasses[maxWidth],
        'rounded-3xl shadow-eventify-lg bg-white'
      )}>
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <DialogHeader className="bg-white">
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 bg-white">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================================
 * BUILDING BLOCKS (Bouwstenen)
 * ============================================================================ */

/* -------------------- Quote Information Block -------------------- */

interface DialogQuoteInfoProps {
  quote: {
    totalPrice: number;
    packageName: string;
    includedServices?: string[];
    customer?: {
      name: string;
    };
    serviceRequest?: {
      customer: {
        name: string;
      };
      eventType: string;
      eventDate: string;
    };
  };
  status?: 'pending' | 'rejected' | 'accepted';
}

export function DialogQuoteInfo({ quote, status = 'pending' }: DialogQuoteInfoProps) {
  const gradientClasses = {
    pending: 'from-purple-50 to-pink-50 border-purple-200',
    rejected: 'from-red-50 to-pink-50 border-red-200',
    accepted: 'from-green-50 to-emerald-50 border-green-200',
  };

  const statusBadges = {
    pending: <Badge className="bg-amber-600 hover:bg-amber-700">In behandeling</Badge>,
    rejected: <Badge className="bg-red-600 hover:bg-red-700">Afgewezen</Badge>,
    accepted: <Badge className="bg-green-600 hover:bg-green-700">Geaccepteerd</Badge>,
  };

  const customerName = quote.customer?.name || quote.serviceRequest?.customer.name || 'Klant';

  return (
    <div className={cn(
      'bg-gradient-to-br rounded-2xl p-6 border-2 shadow-sm',
      gradientClasses[status]
    )}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-3xl font-bold text-gray-900 mb-2">
            €{quote.totalPrice.toLocaleString()}
          </h4>
          <p className="text-lg font-semibold text-gray-700 mb-1">
            {quote.packageName}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {statusBadges[status]}
            <span className="text-sm text-gray-600">
              {customerName}
            </span>
          </div>
        </div>
      </div>

      {/* Included Services */}
      {quote.includedServices && quote.includedServices.length > 0 && (
        <div className="mt-4 p-4 bg-white/60 rounded-xl">
          <p className="text-sm font-semibold text-gray-700 mb-2">Inbegrepen services:</p>
          <ul className="space-y-1">
            {quote.includedServices.map((service, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-600" />
                {service}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Event Details */}
      {quote.serviceRequest && (
        <div className="mt-4 p-4 bg-white/60 rounded-xl">
          <p className="text-sm font-semibold text-gray-700 mb-2">Evenement Details:</p>
          <div className="space-y-1 text-sm text-gray-700">
            <p>• Type: {quote.serviceRequest.eventType}</p>
            <p>• Datum: {new Date(quote.serviceRequest.eventDate).toLocaleDateString('nl-NL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------- Rejection Reason Block -------------------- */

interface DialogRejectionReasonProps {
  reason: string;
  rejectedAt?: string | null;
}

export function DialogRejectionReason({ reason, rejectedAt }: DialogRejectionReasonProps) {
  return (
    <div className="p-4 bg-white/60 rounded-xl border-2 border-red-200">
      <p className="text-sm font-semibold text-red-800 mb-1">Reden van afwijzing:</p>
      <p className="text-sm text-red-700">{reason}</p>
      {rejectedAt && (
        <p className="text-xs text-red-600 mt-2">
          Afgewezen op: {new Date(rejectedAt).toLocaleDateString('nl-NL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      )}
    </div>
  );
}

/* -------------------- Warning Message Block -------------------- */

interface DialogWarningProps {
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  icon?: string;
}

export function DialogWarning({ type, title, message, icon }: DialogWarningProps) {
  const styles = {
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      iconBg: 'bg-amber-100',
      titleColor: 'text-amber-900',
      textColor: 'text-amber-800',
      defaultIcon: '⚠️',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconBg: 'bg-red-100',
      titleColor: 'text-red-900',
      textColor: 'text-red-800',
      defaultIcon: '🚫',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconBg: 'bg-blue-100',
      titleColor: 'text-blue-900',
      textColor: 'text-blue-800',
      defaultIcon: 'ℹ️',
    },
  };

  const style = styles[type];

  return (
    <div className={cn(style.bg, 'border-2', style.border, 'rounded-xl p-4')}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
          style.iconBg
        )}>
          <span className="text-2xl">{icon || style.defaultIcon}</span>
        </div>
        <div>
          <p className={cn('font-semibold mb-1', style.titleColor)}>{title}</p>
          <p className={cn('text-sm', style.textColor)}>{message}</p>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Text Input Field Block -------------------- */

interface DialogTextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  helperText?: string;
}

export function DialogTextField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 3,
  helperText,
}: DialogTextFieldProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 border-2 border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
      />
      {helperText && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
}

/* -------------------- Action Buttons Block -------------------- */

interface DialogActionsProps {
  children: React.ReactNode;
}

export function DialogActions({ children }: DialogActionsProps) {
  return (
    <div className="flex gap-3 pt-2 bg-white">
      {children}
    </div>
  );
}

interface DialogButtonProps {
  onClick: () => void;
  variant: 'danger' | 'success' | 'primary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function DialogButton({
  onClick,
  variant,
  disabled = false,
  loading = false,
  children,
  className,
}: DialogButtonProps) {
  const variants = {
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl',
    success: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl',
    primary: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl',
    outline: 'border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50',
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'flex-1 py-6 rounded-xl transition-all',
        variants[variant],
        className
      )}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          {typeof children === 'string' && children.includes('...') ? children : 'Laden...'}
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
