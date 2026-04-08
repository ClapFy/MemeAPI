import { prisma } from './prisma'
import { v4 as uuidv4 } from 'uuid'

interface RateLimitConfig {
  requestsPerMinute: number
  requestsPerHour: number
  requestsPerDay: number
}

const TIER_CONFIGS: Record<string, RateLimitConfig> = {
  free: { requestsPerMinute: 10, requestsPerHour: 100, requestsPerDay: 500 },
  standard: { requestsPerMinute: 60, requestsPerHour: 1000, requestsPerDay: 5000 },
  premium: { requestsPerMinute: 300, requestsPerHour: 5000, requestsPerDay: 25000 }
}

interface RateLimitStatus {
  allowed: boolean
  remaining: number
  resetAt: Date
  limit: number
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map()

  async checkRateLimit(
    apiKeyId: string,
    tier: string = 'standard'
  ): Promise<RateLimitStatus> {
    const config = TIER_CONFIGS[tier] || TIER_CONFIGS.standard
    const now = Date.now()
    const oneMinuteAgo = now - 60 * 1000

    const key = `ratelimit:${apiKeyId}:minute`
    let timestamps = this.requests.get(key) || []
    timestamps = timestamps.filter(t => t > oneMinuteAgo)

    const remaining = Math.max(0, config.requestsPerMinute - timestamps.length)
    const resetAt = new Date(now + 60 * 1000)

    if (timestamps.length >= config.requestsPerMinute) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        limit: config.requestsPerMinute
      }
    }

    timestamps.push(now)
    this.requests.set(key, timestamps)

    return {
      allowed: true,
      remaining: remaining - 1,
      resetAt,
      limit: config.requestsPerMinute
    }
  }

  getHeaders(status: RateLimitStatus): Record<string, string> {
    return {
      'X-RateLimit-Limit': status.limit.toString(),
      'X-RateLimit-Remaining': Math.max(0, status.remaining).toString(),
      'X-RateLimit-Reset': Math.floor(status.resetAt.getTime() / 1000).toString()
    }
  }

  cleanUp(): void {
    const now = Date.now()
    const oneMinuteAgo = now - 60 * 1000

    for (const [key, timestamps] of Array.from(this.requests.entries())) {
      const filtered = timestamps.filter(t => t > oneMinuteAgo)
      if (filtered.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, filtered)
      }
    }
  }
}

export const rateLimiter = new RateLimiter()

setInterval(() => rateLimiter.cleanUp(), 60000)
