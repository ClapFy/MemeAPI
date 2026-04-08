import { NextRequest, NextResponse } from 'next/server'
import { apiKeyService } from '@/lib/api-key-service'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    
    const stats = await apiKeyService.getStats()
    
    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
