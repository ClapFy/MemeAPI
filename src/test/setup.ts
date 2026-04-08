import { expect, describe, it, beforeEach, vi } from 'vitest'

// Mock environment variables
process.env.ADMIN_USERNAME = 'admin'
process.env.ADMIN_PASSWORD = 'password123'
process.env.DATABASE_URL = 'postgresql://localhost:5432/test'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    memeRequest: {
      create: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    apiKeySeenMeme: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    telegramUser: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    memeCache: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    $queryRaw: vi.fn(),
  }
}))
