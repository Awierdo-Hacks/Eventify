interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

/**
 * Simple in-memory rate limiter.
 * Returns true when the request is allowed, false when the limit is exceeded.
 * In production with multiple instances, replace with Upstash Redis.
 */
export function checkRateLimit(key: string, maxRequests = 5, windowMs = 60_000): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= maxRequests) {
    return false
  }

  entry.count++
  return true
}
