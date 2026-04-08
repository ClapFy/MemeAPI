import axios from 'axios'
import { Meme } from '@/types'
import { prisma } from './prisma'

const DEFAULT_SUBREDDITS = [
  'memes',
  'dankmemes',
  'funny',
  'wholesomememes',
  'me_irl',
  'meirl',
  'ProgrammerHumor',
  'AdviceAnimals',
  'memeeconomy',
  'boneachingjuice'
]

const CACHE_TTL_MINUTES = 5

interface RedditPost {
  data: {
    id: string
    title: string
    url: string
    permalink: string
    subreddit: string
    author: string
    ups: number
    upvote_ratio: number
    num_comments: number
    created_utc: number
    over_18: boolean
    is_video: boolean
    thumbnail: string
    post_hint?: string
  }
}

interface RedditResponse {
  data: {
    children: RedditPost[]
  }
}

class RedditService {
  private cache: Map<string, { memes: Meme[]; timestamp: number }> = new Map()
  private lastRequestTime: number = 0
  private readonly minRequestInterval = 2000

  private async rateLimitDelay(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      )
    }
    this.lastRequestTime = Date.now()
  }

  private getCacheKey(subreddit: string, sort: string): string {
    return `${subreddit}:${sort}`
  }

  private isCacheValid(timestamp: number): boolean {
    const age = Date.now() - timestamp
    return age < CACHE_TTL_MINUTES * 60 * 1000
  }

  private transformRedditPost(post: RedditPost): Meme | null {
    const data = post.data
    
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    const isImage = validExtensions.some(ext => 
      data.url.toLowerCase().endsWith(ext)
    ) || data.post_hint === 'image'
    
    if (!isImage || data.is_video) {
      return null
    }

    return {
      id: data.id,
      title: data.title,
      url: data.url,
      permalink: `https://reddit.com${data.permalink}`,
      subreddit: data.subreddit,
      author: data.author,
      upvotes: data.ups,
      upvoteRatio: data.upvote_ratio,
      comments: data.num_comments,
      createdAt: new Date(data.created_utc * 1000).toISOString(),
      isNsfw: data.over_18,
      thumbnail: data.thumbnail?.startsWith('http') ? data.thumbnail : undefined
    }
  }

  async fetchFromSubreddit(
    subreddit: string, 
    sort: 'hot' | 'top' | 'new' = 'hot',
    limit: number = 50
  ): Promise<Meme[]> {
    const cacheKey = this.getCacheKey(subreddit, sort)
    const cached = this.cache.get(cacheKey)
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.memes
    }

    await this.rateLimitDelay()

    try {
      const response = await axios.get<RedditResponse>(
        `https://www.reddit.com/r/${subreddit}/${sort}.json`,
        {
          params: { limit: Math.min(limit, 100) },
          headers: {
            'User-Agent': 'MemeAPI/1.0 (Development Server)',
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      )

      const memes = response.data.data.children
        .map(post => this.transformRedditPost(post))
        .filter((meme): meme is Meme => meme !== null)

      this.cache.set(cacheKey, { memes, timestamp: Date.now() })
      
      await this.persistToCache(memes)
      
      return memes
    } catch (error) {
      console.error(`Error fetching from r/${subreddit}:`, error)
      return []
    }
  }

  async fetchMultipleSubreddits(
    subreddits: string[],
    sort: 'hot' | 'top' | 'new' = 'hot',
    limit: number = 50
  ): Promise<Meme[]> {
    const results = await Promise.all(
      subreddits.map(sub => this.fetchFromSubreddit(sub, sort, limit))
    )
    
    return results
      .flat()
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, limit)
  }

  async searchMemes(
    query: string,
    subreddits?: string[],
    limit: number = 50
  ): Promise<Meme[]> {
    const targets = subreddits?.length ? subreddits : DEFAULT_SUBREDDITS
    const allMemes = await this.fetchMultipleSubreddits(targets, 'hot', 100)
    
    const searchTerms = query.toLowerCase().split(/\s+/)
    
    return allMemes
      .filter(meme => 
        searchTerms.some(term => 
          meme.title.toLowerCase().includes(term) ||
          meme.subreddit.toLowerCase().includes(term)
        )
      )
      .slice(0, limit)
  }

  async getMemesByUpvoteRange(
    minUpvotes?: number,
    maxUpvotes?: number,
    subreddits?: string[],
    sort: 'hot' | 'top' | 'new' = 'hot',
    limit: number = 50
  ): Promise<Meme[]> {
    const targets = subreddits?.length ? subreddits : DEFAULT_SUBREDDITS
    const allMemes = await this.fetchMultipleSubreddits(targets, sort, 100)
    
    return allMemes
      .filter(meme => {
        if (minUpvotes !== undefined && meme.upvotes < minUpvotes) return false
        if (maxUpvotes !== undefined && meme.upvotes > maxUpvotes) return false
        return true
      })
      .slice(0, limit)
  }

  private async persistToCache(memes: Meme[]): Promise<void> {
    try {
      const operations = memes.map(meme => 
        prisma.memeCache.upsert({
          where: { redditId: meme.id },
          update: {
            upvotes: meme.upvotes,
            comments: meme.comments,
            fetchedAt: new Date()
          },
          create: {
            redditId: meme.id,
            title: meme.title,
            url: meme.url,
            permalink: meme.permalink,
            subreddit: meme.subreddit,
            author: meme.author,
            upvotes: meme.upvotes,
            upvoteRatio: meme.upvoteRatio,
            comments: meme.comments,
            isNsfw: meme.isNsfw
          }
        })
      )
      
      await Promise.all(operations)
    } catch (error) {
      console.error('Error persisting to cache:', error)
    }
  }

  async getCachedMemes(subreddit?: string, limit: number = 50): Promise<Meme[]> {
    const where = subreddit ? { subreddit } : {}
    
    const cached = await prisma.memeCache.findMany({
      where,
      orderBy: { upvotes: 'desc' },
      take: limit
    })

    return cached.map(c => ({
      id: c.redditId,
      title: c.title,
      url: c.url,
      permalink: c.permalink,
      subreddit: c.subreddit,
      author: c.author,
      upvotes: c.upvotes,
      upvoteRatio: c.upvoteRatio,
      comments: c.comments,
      createdAt: c.createdAt.toISOString(),
      isNsfw: c.isNsfw
    }))
  }

  clearCache(): void {
    this.cache.clear()
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

export const redditService = new RedditService()
