import { NextRequest, NextResponse } from 'next/server'
import { apiKeyService } from '@/lib/api-key-service'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const updateCreditsSchema = z.object({
  telegramId: z.string(),
  requests: z.number().int(),
  note: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    
    const users = await apiKeyService.listTelegramUsers()
    
    return NextResponse.json({
      success: true,
      data: users
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.error('Error fetching telegram users:', error)
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
    const validation = updateCreditsSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters' },
        { status: 400 }
      )
    }
    
    const { telegramId, requests, note } = validation.data
    
    if (requests > 0) {
      await apiKeyService.addTelegramUserCredits(telegramId, requests, note)
    } else if (requests < 0) {
      await apiKeyService.removeTelegramUserCredits(telegramId, Math.abs(requests))
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const message = error instanceof Error ? error.message : 'Failed to update credits'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
