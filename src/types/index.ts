export interface Meme {
  id: string
  title: string
  url: string
  permalink: string
  subreddit: string
  author: string
  upvotes: number
  upvoteRatio: number
  comments: number
  createdAt: string
  isNsfw: boolean
  thumbnail?: string
}

export interface MemeRequestParams {
  query?: string
  subreddit?: string
  count?: number
  minUpvotes?: number
  maxUpvotes?: number
  sort?: 'hot' | 'top' | 'new'
  nsfw?: boolean
}

export interface MemeResponse {
  success: boolean
  data: {
    memes: Meme[]
    meta: {
      returned: number
      remainingRequests: number
      source: string
      cached: boolean
    }
  }
}

export interface ApiKeyData {
  id: string
  key: string
  name: string
  requestsUsed: number
  requestsLimit: number
  isActive: boolean
  isUnlimited?: boolean
  createdAt: Date
  lastUsedAt?: Date
  rateLimitTier: string
}

export interface TelegramUserData {
  id: string
  telegramId: string
  username?: string
  firstName?: string
  lastName?: string
  freeRequestsUsed: number
  freeRequestsLimit: number
  starsBalance: number
  totalPurchased: number
}

export interface WebhookEndpointData {
  id: string
  url: string
  events: string[]
  isActive: boolean
  lastError?: string
  lastTriggeredAt?: Date
}

export interface StatsData {
  totalRequests: number
  requestsToday: number
  requestsThisWeek: number
  requestsThisMonth: number
  activeApiKeys: number
  topQueries: Array<{ query: string; count: number }>
  topSubreddits: Array<{ subreddit: string; count: number }>
  averageResponseTime: number
  errorRate: number
}

export interface PaymentData {
  id: string
  telegramId: string
  amount: number
  requestsAdded: number
  status: string
  createdAt: Date
  completedAt?: Date
  user?: {
    telegramId: string
    username?: string | null
    name: string
  }
}

export interface StarStats {
  totalTransactions: number
  totalStars: number
  totalRequestsPurchased: number
  completedTransactions: number
  pendingTransactions: number
  failedTransactions: number
}

export interface TelegramUserStats {
  user: {
    telegramId: string
    username?: string | null
    name: string
  }
  freeRequests: {
    used: number
    limit: number
  }
  purchased: {
    totalStarsSpent: number
    totalRequestsPurchased: number
    starsBalance: number
  }
  current: {
    remainingRequests: number | string
    totalRequestsUsed: number
  }
  recentTransactions: Array<{
    id: string
    stars: number
    requestsAdded: number
    status: string
    date: Date
  }>
}
