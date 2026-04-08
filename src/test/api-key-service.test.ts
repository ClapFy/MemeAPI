import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiKeyService } from '@/lib/api-key-service'
import { prisma } from '@/lib/prisma'

describe('API Key Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create an API key', async () => {
    const mockKey = {
      id: 'test-id',
      key: 'meme_testkey123',
      name: 'Test Key',
      requestsUsed: 0,
      requestsLimit: 1000,
      isActive: true,
      createdAt: new Date(),
      lastUsedAt: null,
      rateLimitTier: 'standard'
    }

    vi.mocked(prisma.apiKey.create).mockResolvedValue(mockKey as any)

    const result = await apiKeyService.createApiKey('Test Key', 1000, 'standard')

    expect(result).toBeDefined()
    expect(result.name).toBe('Test Key')
    expect(result.requestsLimit).toBe(1000)
    expect(result.rateLimitTier).toBe('standard')
    expect(prisma.apiKey.create).toHaveBeenCalled()
  })

  it('should validate an active API key', async () => {
    const mockKey = {
      id: 'test-id',
      key: 'meme_validkey',
      name: 'Valid Key',
      requestsUsed: 100,
      requestsLimit: 1000,
      isActive: true,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      rateLimitTier: 'standard'
    }

    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(mockKey as any)

    const result = await apiKeyService.validateApiKey('meme_validkey')

    expect(result).toBeDefined()
    expect(result?.isActive).toBe(true)
    expect(result?.requestsUsed).toBe(100)
  })

  it('should return null for invalid API key', async () => {
    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(null)

    const result = await apiKeyService.validateApiKey('invalid_key')

    expect(result).toBeNull()
  })

  it('should return null for revoked API key', async () => {
    const mockKey = {
      id: 'test-id',
      key: 'meme_revoked',
      name: 'Revoked Key',
      requestsUsed: 0,
      requestsLimit: 1000,
      isActive: false,
      createdAt: new Date(),
      lastUsedAt: null,
      rateLimitTier: 'standard'
    }

    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(mockKey as any)

    const result = await apiKeyService.validateApiKey('meme_revoked')

    expect(result).toBeNull()
  })

  it('should return null for exhausted API key', async () => {
    const mockKey = {
      id: 'test-id',
      key: 'meme_exhausted',
      name: 'Exhausted Key',
      requestsUsed: 1000,
      requestsLimit: 1000,
      isActive: true,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      rateLimitTier: 'standard'
    }

    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(mockKey as any)

    const result = await apiKeyService.validateApiKey('meme_exhausted')

    expect(result).toBeNull()
  })
})
