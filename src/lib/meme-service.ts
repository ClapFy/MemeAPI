import { Meme, MemeRequestParams } from '@/types'
import { redditService } from './reddit'
import { prisma } from './prisma'
import { v4 as uuidv4 } from 'uuid'

interface FetchResult {
  memes: Meme[]
  fromCache: boolean
}

class MemeService {
  private readonly SEEN_MEME_LIMIT = 100

  async fetchMemes(
    apiKeyId: string,
    params: MemeRequestParams
  ): Promise<FetchResult> {
    const {
      query,
      subreddit,
      count = 10,
      minUpvotes,
      maxUpvotes,
      sort = 'hot',
      nsfw = false
    } = params

    const limit = Math.min(Math.max(1, count), 50)
    const subreddits = subreddit ? [subreddit] : undefined

    let candidates: Meme[] = []
    let fromCache = false

    if (query) {
      candidates = await redditService.searchMemes(query, subreddits, limit * 3)
    } else if (minUpvotes !== undefined || maxUpvotes !== undefined) {
      candidates = await redditService.getMemesByUpvoteRange(
        minUpvotes,
        maxUpvotes,
        subreddits,
        sort,
        limit * 3
      )
    } else {
      candidates = await redditService.fetchMultipleSubreddits(
        subreddits || ['memes', 'dankmemes', 'funny'],
        sort,
        limit * 3
      )
    }

    if (candidates.length === 0) {
      const cached = await redditService.getCachedMemes(subreddit, limit * 3)
      if (cached.length > 0) {
        candidates = cached
        fromCache = true
      }
    }

    if (!nsfw) {
      candidates = candidates.filter(m => !m.isNsfw)
    }

    const filteredMemes = await this.filterDuplicates(apiKeyId, candidates, limit)

    await this.trackSeenMemes(apiKeyId, filteredMemes)

    return { memes: filteredMemes, fromCache }
  }

  private async filterDuplicates(
    apiKeyId: string,
    candidates: Meme[],
    limit: number
  ): Promise<Meme[]> {
    const seenMemes = await prisma.apiKeySeenMeme.findMany({
      where: { apiKeyId },
      orderBy: { lastReturnedAt: 'desc' },
      take: this.SEEN_MEME_LIMIT
    })

    const seenIds = new Set(seenMemes.map(sm => sm.redditId))
    const freshMemes = candidates.filter(m => !seenIds.has(m.id))

    if (freshMemes.length >= limit) {
      return freshMemes.slice(0, limit)
    }

    const needed = limit - freshMemes.length
    const oldestSeen = await prisma.apiKeySeenMeme.findMany({
      where: { 
        apiKeyId,
        redditId: { in: candidates.map(c => c.id) }
      },
      orderBy: { lastReturnedAt: 'asc' },
      take: needed
    })

    const oldestIds = new Set(oldestSeen.map(os => os.redditId))
    const recycledMemes = candidates.filter(m => oldestIds.has(m.id))

    await prisma.apiKeySeenMeme.updateMany({
      where: {
        apiKeyId,
        redditId: { in: recycledMemes.map(m => m.id) }
      },
      data: {
        lastReturnedAt: new Date(),
        returnCount: { increment: 1 }
      }
    })

    return [...freshMemes, ...recycledMemes].slice(0, limit)
  }

  private async trackSeenMemes(apiKeyId: string, memes: Meme[]): Promise<void> {
    const now = new Date()
    
    const operations = memes.map(meme => 
      prisma.apiKeySeenMeme.upsert({
        where: {
          apiKeyId_redditId: {
            apiKeyId,
            redditId: meme.id
          }
        },
        update: {
          lastReturnedAt: now,
          returnCount: { increment: 1 }
        },
        create: {
          apiKeyId,
          redditId: meme.id,
          permalink: meme.permalink,
          title: meme.title,
          firstSeenAt: now,
          lastReturnedAt: now,
          returnCount: 1
        }
      })
    )

    await Promise.all(operations)

    const count = await prisma.apiKeySeenMeme.count({ where: { apiKeyId } })
    if (count > this.SEEN_MEME_LIMIT * 2) {
      const toDelete = await prisma.apiKeySeenMeme.findMany({
        where: { apiKeyId },
        orderBy: { lastReturnedAt: 'desc' },
        skip: this.SEEN_MEME_LIMIT,
        select: { id: true }
      })

      await prisma.apiKeySeenMeme.deleteMany({
        where: {
          id: { in: toDelete.map(d => d.id) }
        }
      })
    }
  }

  async logRequest(
    apiKeyId: string,
    params: MemeRequestParams,
    memes: Meme[],
    responseTime: number,
    statusCode: number = 200,
    error?: string
  ): Promise<void> {
    await prisma.memeRequest.create({
      data: {
        apiKeyId,
        query: params.query,
        subreddit: params.subreddit,
        count: params.count || 10,
        minUpvotes: params.minUpvotes,
        maxUpvotes: params.maxUpvotes,
        sort: params.sort || 'hot',
        nsfw: params.nsfw || false,
        memesReturned: memes as any,
        responseTime,
        statusCode,
        error
      }
    })

    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: {
        requestsUsed: { increment: 1 },
        lastUsedAt: new Date()
      }
    })
  }

  async getRandomMeme(params: MemeRequestParams = {}): Promise<Meme | null> {
    const result = await this.fetchMemes('system', { ...params, count: 1 })
    return result.memes[0] || null
  }
}

export const memeService = new MemeService()
