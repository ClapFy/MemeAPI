import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiKeyService } from '@/lib/api-key-service'
import { memeService } from '@/lib/meme-service'
import { rateLimiter } from '@/lib/rate-limiter'
import axios from 'axios'

const requestSchema = z.object({
  apiKey: z.string().min(1),
  query: z.string().optional(),
  subreddit: z.string().optional(),
  minUpvotes: z.coerce.number().optional(),
  maxUpvotes: z.coerce.number().optional(),
  sort: z.enum(['hot', 'top', 'new']).optional().default('hot'),
  nsfw: z.coerce.boolean().optional().default(false)
})

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    
    const validation = requestSchema.safeParse({
      apiKey: searchParams.get('apiKey'),
      query: searchParams.get('query') || undefined,
      subreddit: searchParams.get('subreddit') || undefined,
      minUpvotes: searchParams.get('minUpvotes') || undefined,
      maxUpvotes: searchParams.get('maxUpvotes') || undefined,
      sort: searchParams.get('sort') || 'hot',
      nsfw: searchParams.get('nsfw') || false
    })

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters' },
        { status: 400 }
      )
    }

    const params = validation.data

    const apiKeyData = await apiKeyService.validateApiKey(params.apiKey)
    
    if (!apiKeyData) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired API key' },
        { status: 401 }
      )
    }

    const rateLimit = await rateLimiter.checkRateLimit(
      apiKeyData.id,
      apiKeyData.rateLimitTier
    )

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const { memes } = await memeService.fetchMemes(apiKeyData.id, {
      query: params.query,
      subreddit: params.subreddit,
      count: 1,
      minUpvotes: params.minUpvotes,
      maxUpvotes: params.maxUpvotes,
      sort: params.sort,
      nsfw: params.nsfw
    })

    if (memes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No memes found' },
        { status: 404 }
      )
    }

    const meme = memes[0]
    const responseTime = Date.now() - startTime

    await memeService.logRequest(
      apiKeyData.id,
      { query: params.query, subreddit: params.subreddit, count: 1 },
      memes,
      responseTime,
      200
    )

    try {
      const imageResponse = await axios.get(meme.url, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'MemeAPI/1.0'
        }
      })

      const contentType = imageResponse.headers['content-type'] || 'image/jpeg'

      return new NextResponse(imageResponse.data, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=300',
          'X-Meme-Title': encodeURIComponent(meme.title),
          'X-Meme-Subreddit': meme.subreddit,
          'X-Meme-Upvotes': meme.upvotes.toString(),
          ...rateLimiter.getHeaders(rateLimit)
        }
      })
    } catch (imageError) {
      return NextResponse.redirect(meme.url)
    }

  } catch (error) {
    console.error('Error in image endpoint:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
