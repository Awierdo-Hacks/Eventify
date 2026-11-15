'use client';

import { useCallback, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { GENERIC_ERROR, type ActionResult } from '@/lib/action';

interface Options<T> {
  /** Toast shown on success (falls back to the action's own message). */
  successMessage?: string;
  onSuccess?: (data: T) => void;
  /** Set false to handle the error yourself (it is still returned). */
  toastError?: boolean;
}

/**
 * Runs a server action with pending state, field errors and toasts handled
 * the same way everywhere.
 */
export function useAction<Input, T>(
  action: (input: Input) => Promise<ActionResult<T>>,
  options: Options<T> = {},
) {
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const { successMessage, onSuccess, toastError = true } = options;

  const run = useCallback(
    (input: Input) => {
      setError(null);
      setFieldErrors({});
      startTransition(async () => {
        let result: ActionResult<T>;
        try {
          result = await action(input);
        } catch (thrown) {
          // Redirects from server actions surface as thrown errors: let them through.
          if (thrown && typeof thrown === 'object' && 'digest' in thrown) throw thrown;
          result = { ok: false, error: GENERIC_ERROR };
        }
        if (result.ok) {
          const message = successMessage ?? result.message;
          if (message) toast.success(message);
          onSuccess?.(result.data);
        } else {
          setError(result.error);
          setFieldErrors(result.fieldErrors ?? {});
          if (toastError && !result.fieldErrors) toast.error(result.error);
        }
      });
    },
    [action, onSuccess, successMessage, toastError],
  );

  return { run, pending, error, fieldErrors, clearErrors: () => { setError(null); setFieldErrors({}); } };
}
