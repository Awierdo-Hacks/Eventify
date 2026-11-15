'use client';

import { Toaster as Sonner } from 'sonner';

/** App-wide toast outlet. Call `toast.success(...)` / `toast.error(...)` from `sonner`. */
function Toaster() {
  return (
    <Sonner
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            '!rounded-xl !border !border-ink-200 !bg-surface !text-ink-900 !shadow-lg !font-sans !text-sm !font-medium',
          description: '!text-ink-600',
          success: '[&_[data-icon]]:!text-success-600',
          error: '[&_[data-icon]]:!text-danger-600',
        },
      }}
    />
  );
}

export { Toaster };
