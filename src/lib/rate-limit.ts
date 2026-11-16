import 'server-only';
import { headers } from 'next/headers';

/**
 * Small in-memory sliding-window limiter. It protects a single server
 * instance, which is enough to blunt brute force and form spam. On a
 * multi-instance or serverless deployment, back it with a shared store
 * (e.g. Redis) for hard guarantees.
 */
const buckets = new Map<string, number[]>();
const MAX_KEYS = 10_000;

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);

  if (recent.length >= limit) {
    buckets.set(key, recent);
    const oldest = recent[0] ?? now;
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
    };
  }

  recent.push(now);
  buckets.set(key, recent);

  if (buckets.size > MAX_KEYS) {
    for (const [bucketKey, timestamps] of buckets) {
      if (timestamps.every((timestamp) => now - timestamp >= windowMs)) buckets.delete(bucketKey);
    }
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export async function clientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || headerList.get('x-real-ip') || 'unknown';
}

/** Rate limit the current request by IP for a named action. */
export async function limitByIp(action: string, limit: number, windowMs: number) {
  return rateLimit(`${action}:${await clientIp()}`, limit, windowMs);
}

export const TOO_MANY_REQUESTS = 'Te veel pogingen. Wacht even en probeer het opnieuw.';
