import { NextResponse } from 'next/server';
import { z } from 'zod';

type ParseResult<T> = { data: T; error: null } | { data: null; error: NextResponse };

/**
 * Parses a JSON request body against a zod schema.
 * Returns a ready-to-return 400 response when the body is invalid.
 */
export async function parseBody<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<ParseResult<z.infer<T>>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { data: null, error: NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 }) };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue?.path.join('.');
    return {
      data: null,
      error: NextResponse.json(
        { error: field ? `Ongeldige invoer voor '${field}': ${issue.message}` : 'Ongeldige invoer', issues: result.error.issues },
        { status: 400 }
      ),
    };
  }

  return { data: result.data, error: null };
}

/** Accepts ISO date strings ("2026-06-12" or full ISO timestamps). */
export const dateString = z
  .string()
  .refine((value) => !Number.isNaN(new Date(value).getTime()), 'ongeldige datum');

export const trimmedString = (min = 1, max = 5000) => z.string().trim().min(min).max(max);
