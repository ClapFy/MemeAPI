import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiKeyService } from '@/lib/api-key-service'
import { memeService } from '@/lib/meme-service'
import { rateLimiter } from '@/lib/rate-limiter'
import { MemeRequestParams } from '@/types'

const requestSchema = z.object({
  apiKey: z.string().min(1),
  query: z.string().optional(),
  subreddit: z.string().optional(),
  count: z.coerce.number().min(1).max(50).optional().default(10),
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
      count: searchParams.get('count') || 10,
      minUpvotes: searchParams.get('minUpvotes') || undefined,
      maxUpvotes: searchParams.get('maxUpvotes') || undefined,
      sort: searchParams.get('sort') || 'hot',
      nsfw: searchParams.get('nsfw') || false
    })

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid parameters',
          details: validation.error.errors 
        },
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
        { 
          success: false, 
          error: 'Rate limit exceeded',
          resetAt: rateLimit.resetAt
        },
        { 
          status: 429,
          headers: rateLimiter.getHeaders(rateLimit)
        }
      )
    }

    const memeParams: MemeRequestParams = {
      query: params.query,
      subreddit: params.subreddit,
      count: params.count,
      minUpvotes: params.minUpvotes,
      maxUpvotes: params.maxUpvotes,
      sort: params.sort,
      nsfw: params.nsfw
    }

    const { memes, fromCache } = await memeService.fetchMemes(
      apiKeyData.id,
      memeParams
    )

    const responseTime = Date.now() - startTime

    await memeService.logRequest(
      apiKeyData.id,
      memeParams,
      memes,
      responseTime,
      200
    )

    const remainingRequests = Math.max(0, apiKeyData.requestsLimit - apiKeyData.requestsUsed - 1)

    return NextResponse.json(
      {
        success: true,
        data: {
          memes,
          meta: {
            returned: memes.length,
            remainingRequests,
            source: 'reddit',
            cached: fromCache
          }
        }
      },
      {
        headers: {
          ...rateLimiter.getHeaders(rateLimit),
          'X-Remaining-Requests': remainingRequests.toString()
        }
      }
    )

  } catch (error) {
    const responseTime = Date.now() - startTime
    
    console.error('Error in memes endpoint:', error)

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
