import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redditService } from '@/lib/reddit'

export async function GET() {
  const checks = {
    database: false,
    reddit: false,
    timestamp: new Date().toISOString()
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = true
  } catch (error) {
    console.error('Database health check failed:', error)
  }

  try {
    const memes = await redditService.fetchFromSubreddit('memes', 'hot', 1)
    checks.reddit = memes.length > 0
  } catch (error) {
    console.error('Reddit health check failed:', error)
  }

  const isHealthy = checks.database && checks.reddit

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks
    },
    { status: isHealthy ? 200 : 503 }
  )
}
