import { prisma } from './prisma'
import { v4 as uuidv4 } from 'uuid'
import { ApiKeyData } from '@/types'

class ApiKeyService {
  async createApiKey(
    name: string = 'Unnamed Key',
    requestsLimit: number = 1000,
    rateLimitTier: string = 'standard',
    isUnlimited: boolean = false
  ): Promise<ApiKeyData> {
    const key = `meme_${uuidv4().replace(/-/g, '')}`
    
    const apiKey = await prisma.apiKey.create({
      data: {
        key,
        name,
        requestsLimit: isUnlimited ? -1 : requestsLimit,
        rateLimitTier,
        isActive: true,
        requestsUsed: 0,
        isUnlimited
      }
    })

    return this.transformToData(apiKey)
  }

  async validateApiKey(key: string): Promise<ApiKeyData | null> {
    const apiKey = await prisma.apiKey.findUnique({
      where: { key }
    })

    if (!apiKey || !apiKey.isActive) {
      return null
    }

    if (!apiKey.isUnlimited && apiKey.requestsUsed >= apiKey.requestsLimit) {
      return null
    }

    return this.transformToData(apiKey)
  }

  async getApiKeyById(id: string): Promise<ApiKeyData | null> {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id }
    })

    return apiKey ? this.transformToData(apiKey) : null
  }

  async listApiKeys(includeInactive: boolean = false): Promise<ApiKeyData[]> {
    const apiKeys = await prisma.apiKey.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    return apiKeys.map(k => this.transformToData(k))
  }

  async revokeApiKey(id: string): Promise<boolean> {
    try {
      await prisma.apiKey.update({
        where: { id },
        data: { isActive: false }
      })
      return true
    } catch {
      return false
    }
  }

  async regenerateApiKey(id: string): Promise<ApiKeyData | null> {
    const newKey = `meme_${uuidv4().replace(/-/g, '')}`
    
    try {
      const updated = await prisma.apiKey.update({
        where: { id },
        data: { key: newKey }
      })
      return this.transformToData(updated)
    } catch {
      return null
    }
  }

  async updateApiKey(
    id: string,
    updates: { name?: string; requestsLimit?: number; rateLimitTier?: string; isUnlimited?: boolean }
  ): Promise<ApiKeyData | null> {
    try {
      const updateData: any = { ...updates }
      if (updates.isUnlimited !== undefined) {
        updateData.requestsLimit = updates.isUnlimited ? -1 : (updates.requestsLimit || 1000)
      }
      
      const updated = await prisma.apiKey.update({
        where: { id },
        data: updateData
      })
      return this.transformToData(updated)
    } catch {
      return null
    }
  }

  async getStats(apiKeyId?: string) {
    const where = apiKeyId ? { apiKeyId } : {}

    const [
      totalRequests,
      requestsToday,
      requestsThisWeek,
      requestsThisMonth,
      activeKeys,
      avgResponseTime
    ] = await Promise.all([
      prisma.memeRequest.count({ where }),
      prisma.memeRequest.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.memeRequest.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.memeRequest.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.apiKey.count({ where: { isActive: true } }),
      prisma.memeRequest.aggregate({
        where,
        _avg: { responseTime: true }
      })
    ])

    const topQueries = await prisma.memeRequest.groupBy({
      by: ['query'],
      where: { ...where, query: { not: null } },
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: 10
    })

    const topSubreddits = await prisma.memeRequest.groupBy({
      by: ['subreddit'],
      where: { ...where, subreddit: { not: null } },
      _count: { subreddit: true },
      orderBy: { _count: { subreddit: 'desc' } },
      take: 10
    })

    const errorRate = await this.calculateErrorRate(where)

    return {
      totalRequests,
      requestsToday,
      requestsThisWeek,
      requestsThisMonth,
      activeApiKeys: activeKeys,
      topQueries: topQueries.map(q => ({ query: q.query!, count: q._count.query })),
      topSubreddits: topSubreddits.map(s => ({ subreddit: s.subreddit!, count: s._count.subreddit })),
      averageResponseTime: Math.round(avgResponseTime._avg.responseTime || 0),
      errorRate
    }
  }

  // Star transactions monitoring
  async getStarTransactions(limit: number = 50) {
    const transactions = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        telegramUser: {
          select: {
            telegramId: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return transactions.map(t => ({
      id: t.id,
      telegramId: t.telegramId,
      user: t.telegramUser ? {
        id: t.telegramUser.telegramId,
        username: t.telegramUser.username,
        name: [t.telegramUser.firstName, t.telegramUser.lastName].filter(Boolean).join(' ')
      } : null,
      stars: t.amount,
      requestsAdded: t.requestsAdded,
      status: t.status,
      createdAt: t.createdAt,
      completedAt: t.completedAt
    }))
  }

  async getStarStats() {
    const [
      totalTransactions,
      totalStars,
      totalRequestsPurchased,
      completedTransactions,
      pendingTransactions,
      failedTransactions
    ] = await Promise.all([
      prisma.payment.count(),
      prisma.payment.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: { status: 'completed' },
        _sum: { requestsAdded: true }
      }),
      prisma.payment.count({ where: { status: 'completed' } }),
      prisma.payment.count({ where: { status: 'pending' } }),
      prisma.payment.count({ where: { status: 'failed' } })
    ])

    return {
      totalTransactions,
      totalStars: totalStars._sum.amount || 0,
      totalRequestsPurchased: totalRequestsPurchased._sum.requestsAdded || 0,
      completedTransactions,
      pendingTransactions,
      failedTransactions
    }
  }

  // Telegram user credit management
  async listTelegramUsers() {
    const users = await prisma.telegramUser.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        apiKey: true
      }
    })

    return users.map(u => ({
      id: u.id,
      telegramId: u.telegramId,
      username: u.username,
      name: [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Unknown',
      freeRequestsUsed: u.freeRequestsUsed,
      freeRequestsLimit: u.freeRequestsLimit,
      starsBalance: u.starsBalance,
      totalPurchased: u.totalPurchased,
      apiKeyId: u.apiKeyId,
      apiKey: u.apiKey ? {
        key: u.apiKey.key.slice(0, 12) + '...',
        requestsUsed: u.apiKey.requestsUsed,
        requestsLimit: u.apiKey.requestsLimit,
        isUnlimited: u.apiKey.requestsLimit === -1
      } : null,
      createdAt: u.createdAt
    }))
  }

  async addTelegramUserCredits(telegramId: string, requests: number, note?: string) {
    const user = await prisma.telegramUser.findUnique({
      where: { telegramId }
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (!user.apiKeyId) {
      throw new Error('User has no API key')
    }

    await prisma.apiKey.update({
      where: { id: user.apiKeyId },
      data: {
        requestsLimit: {
          increment: requests
        }
      }
    })

    // Log the manual credit addition
    await prisma.payment.create({
      data: {
        telegramId,
        amount: 0,
        requestsAdded: requests,
        status: 'completed',
        telegramPaymentId: `manual_${Date.now()}`,
        completedAt: new Date()
      }
    })

    return true
  }

  async removeTelegramUserCredits(telegramId: string, requests: number) {
    const user = await prisma.telegramUser.findUnique({
      where: { telegramId },
      include: { apiKey: true }
    })

    if (!user || !user.apiKey) {
      throw new Error('User not found')
    }

    const currentLimit = user.apiKey.requestsLimit === -1 ? user.apiKey.requestsUsed + 1000 : user.apiKey.requestsLimit
    const newLimit = Math.max(user.apiKey.requestsUsed, currentLimit - requests)

    await prisma.apiKey.update({
      where: { id: user.apiKeyId! },
      data: {
        requestsLimit: newLimit
      }
    })

    return true
  }

  async getTelegramUserStats(telegramId: string) {
    const user = await prisma.telegramUser.findUnique({
      where: { telegramId },
      include: {
        apiKey: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    const totalSpent = await prisma.payment.aggregate({
      where: {
        telegramId,
        status: 'completed'
      },
      _sum: {
        amount: true
      }
    })

    const remainingRequests = user.apiKey 
      ? (user.apiKey.requestsLimit === -1 ? 'Unlimited' : user.apiKey.requestsLimit - user.apiKey.requestsUsed)
      : 0

    return {
      user: {
        telegramId: user.telegramId,
        username: user.username,
        name: [user.firstName, user.lastName].filter(Boolean).join(' ')
      },
      freeRequests: {
        used: user.freeRequestsUsed,
        limit: user.freeRequestsLimit
      },
      purchased: {
        totalStarsSpent: totalSpent._sum.amount || 0,
        totalRequestsPurchased: user.totalPurchased,
        starsBalance: user.starsBalance
      },
      current: {
        remainingRequests,
        totalRequestsUsed: user.apiKey?.requestsUsed || 0
      },
      recentTransactions: user.payments.map(p => ({
        id: p.id,
        stars: p.amount,
        requestsAdded: p.requestsAdded,
        status: p.status,
        date: p.createdAt
      }))
    }
  }

  private async calculateErrorRate(where: any): Promise<number> {
    const [total, errors] = await Promise.all([
      prisma.memeRequest.count({ where }),
      prisma.memeRequest.count({
        where: { ...where, statusCode: { gte: 400 } }
      })
    ])

    return total > 0 ? Math.round((errors / total) * 100) : 0
  }

  private transformToData(apiKey: any): ApiKeyData {
    return {
      id: apiKey.id,
      key: apiKey.key,
      name: apiKey.name,
      requestsUsed: apiKey.requestsUsed,
      requestsLimit: apiKey.requestsLimit,
      isActive: apiKey.isActive,
      createdAt: apiKey.createdAt,
      lastUsedAt: apiKey.lastUsedAt || undefined,
      rateLimitTier: apiKey.rateLimitTier,
      isUnlimited: apiKey.requestsLimit === -1 || apiKey.isUnlimited
    }
  }
}

export const apiKeyService = new ApiKeyService()
