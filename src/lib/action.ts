import type { ZodError } from 'zod';

/**
 * Every server action returns this shape, so forms can handle success, a
 * general error and per-field errors in one consistent way.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function ok(): ActionResult<undefined>;
export function ok<T>(data: T, message?: string): ActionResult<T>;
export function ok<T>(data?: T, message?: string): ActionResult<T | undefined> {
  return { ok: true, data, message };
}

export function fail(error: string, fieldErrors?: Record<string, string>): { ok: false; error: string; fieldErrors?: Record<string, string> } {
  return { ok: false, error, fieldErrors };
}

/** First message per field from a zod error. */
export function fieldErrorsFrom(error: ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.');
    if (key && !(key in result)) result[key] = issue.message;
  }
  return result;
}

export function invalid(error: ZodError) {
  return fail('Controleer de gemarkeerde velden.', fieldErrorsFrom(error));
}

export const GENERIC_ERROR = 'Er ging iets mis. Probeer het opnieuw.';
