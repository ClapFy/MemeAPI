import { describe, it, expect, vi, beforeEach } from 'vitest'
import { rateLimiter } from '@/lib/rate-limiter'

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should allow requests under the limit', async () => {
    const result = await rateLimiter.checkRateLimit('test-key', 'standard')
    
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBeGreaterThan(0)
    expect(result.limit).toBe(60)
  })

  it('should track remaining requests correctly', async () => {
    // Make 5 requests
    for (let i = 0; i < 5; i++) {
      await rateLimiter.checkRateLimit('test-key', 'standard')
    }
    
    const result = await rateLimiter.checkRateLimit('test-key', 'standard')
    
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(60 - 6) // 60 - 6 requests made
  })

  it('should generate correct headers', () => {
    const status = {
      allowed: true,
      remaining: 50,
      resetAt: new Date('2024-01-15T12:01:00Z'),
      limit: 60
    }
    
    const headers = rateLimiter.getHeaders(status)
    
    expect(headers['X-RateLimit-Limit']).toBe('60')
    expect(headers['X-RateLimit-Remaining']).toBe('50')
    expect(headers['X-RateLimit-Reset']).toBeDefined()
  })
})
