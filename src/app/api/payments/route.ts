import { NextRequest, NextResponse } from 'next/server'
import { apiKeyService } from '@/lib/api-key-service'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const [transactions, stats] = await Promise.all([
      apiKeyService.getStarTransactions(limit),
      apiKeyService.getStarStats()
    ])
    
    return NextResponse.json({
      success: true,
      data: {
        transactions,
        stats
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
