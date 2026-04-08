import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiKeyService } from '@/lib/api-key-service'
import { requireAuth } from '@/lib/auth'

const createSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  requestsLimit: z.number().min(1).max(1000000).optional(),
  rateLimitTier: z.enum(['free', 'standard', 'premium']).optional(),
  isUnlimited: z.boolean().optional()
})

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    
    const keys = await apiKeyService.listApiKeys(includeInactive)
    
    return NextResponse.json({ success: true, data: keys })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.error('Error listing keys:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    
    const body = await request.json()
    const validation = createSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters' },
        { status: 400 }
      )
    }
    
    const { name, requestsLimit, rateLimitTier, isUnlimited } = validation.data
    
    const key = await apiKeyService.createApiKey(
      name,
      requestsLimit,
      rateLimitTier,
      isUnlimited
    )
    
    return NextResponse.json({ success: true, data: key }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.error('Error creating key:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID required' },
        { status: 400 }
      )
    }
    
    const success = await apiKeyService.revokeApiKey(id)
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Key not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.error('Error revoking key:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
