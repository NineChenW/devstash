import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

export type RateLimitProfile =
  | "login"
  | "register"
  | "forgot-password"
  | "reset-password"
  | "resend-verification"
  | "ai"

type ProfileConfig = {
  limit: number
  window: Parameters<typeof Ratelimit.slidingWindow>[1]
}

const PROFILES: Record<RateLimitProfile, ProfileConfig> = {
  login: { limit: 5, window: "15 m" },
  register: { limit: 3, window: "1 h" },
  "forgot-password": { limit: 3, window: "1 h" },
  "reset-password": { limit: 5, window: "15 m" },
  "resend-verification": { limit: 3, window: "15 m" },
  ai: { limit: 20, window: "1 h" },
}

let redisClient: Redis | null | undefined
const limiters = new Map<RateLimitProfile, Ratelimit>()

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    redisClient = null
    return null
  }
  redisClient = new Redis({ url, token })
  return redisClient
}

function getLimiter(profile: RateLimitProfile): Ratelimit | null {
  const existing = limiters.get(profile)
  if (existing) return existing
  const redis = getRedis()
  if (!redis) return null
  const { limit, window } = PROFILES[profile]
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: false,
    prefix: `rl:${profile}`,
  })
  limiters.set(profile, limiter)
  return limiter
}

export type RateLimitResult = {
  success: boolean
  remaining: number
  reset: number
  limit: number
}

export async function checkRateLimit(
  profile: RateLimitProfile,
  identifier: string,
): Promise<RateLimitResult> {
  const limiter = getLimiter(profile)
  const config = PROFILES[profile]
  if (!limiter) {
    return { success: true, remaining: config.limit, reset: 0, limit: config.limit }
  }
  try {
    const res = await limiter.limit(identifier)
    return {
      success: res.success,
      remaining: res.remaining,
      reset: res.reset,
      limit: res.limit,
    }
  } catch (err) {
    console.error(`[rate-limit:${profile}] upstream error — failing open`, err)
    return { success: true, remaining: config.limit, reset: 0, limit: config.limit }
  }
}

export function getRequestIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) {
    const first = xff.split(",")[0]?.trim()
    if (first) return first
  }
  const real = req.headers.get("x-real-ip")
  if (real) return real.trim()
  return "127.0.0.1"
}

export function buildRateLimitKey(ip: string, extra?: string | null): string {
  const base = ip || "unknown"
  if (!extra) return base
  return `${base}:${extra.trim().toLowerCase()}`
}

export function minutesUntil(reset: number): number {
  if (!reset) return 1
  const ms = reset - Date.now()
  if (ms <= 0) return 1
  return Math.max(1, Math.ceil(ms / 60000))
}

export function rateLimitResponse(result: RateLimitResult): Response {
  const minutes = minutesUntil(result.reset)
  const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000) || 60)
  const body = JSON.stringify({
    error: `Too many attempts. Please try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`,
    code: "rate_limited",
  })
  return new Response(body, {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfter),
      "X-RateLimit-Limit": String(result.limit),
      "X-RateLimit-Remaining": String(result.remaining),
      "X-RateLimit-Reset": String(result.reset),
    },
  })
}
