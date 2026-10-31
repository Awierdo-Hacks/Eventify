import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetAt: number
}

// Fallback for local development without Upstash. On Vercel every serverless
// instance has its own memory, so production must use Upstash.
const memoryStore = new Map<string, RateLimitEntry>()

function checkMemory(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = memoryStore.get(key)

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= maxRequests) {
    return false
  }

  entry.count++
  return true
}

const redisUrl = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null

const limiters = new Map<string, Ratelimit>()

function getLimiter(maxRequests: number, windowMs: number): Ratelimit | null {
  if (!redis) return null
  const id = `${maxRequests}:${windowMs}`
  let limiter = limiters.get(id)
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs} ms`),
      prefix: 'eventiphy:rl',
    })
    limiters.set(id, limiter)
  }
  return limiter
}

/**
 * Rate limiter backed by Upstash Redis (in-memory fallback in development).
 * Returns true when the request is allowed, false when the limit is exceeded.
 */
export async function checkRateLimit(key: string, maxRequests = 5, windowMs = 60_000): Promise<boolean> {
  const limiter = getLimiter(maxRequests, windowMs)
  if (!limiter) return checkMemory(key, maxRequests, windowMs)

  try {
    const { success } = await limiter.limit(key)
    return success
  } catch (error) {
    // Never lock users out because Redis is unreachable
    console.error('Rate limiter error:', error)
    return true
  }
}

/** Best-effort client IP for rate-limit keys on Vercel. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}

export function rateLimitResponse() {
  return NextResponse.json(
    { error: 'Te veel verzoeken. Probeer het over een minuut opnieuw.' },
    { status: 429 }
  )
}
