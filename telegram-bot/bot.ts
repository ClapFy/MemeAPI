import TelegramBot from 'node-telegram-bot-api'
import { prisma } from '../src/lib/prisma'
import { memeService } from '../src/lib/meme-service'
import { apiKeyService } from '../src/lib/api-key-service'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN

if (!TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is required')
  process.exit(1)
}

const bot = new TelegramBot(TOKEN, { polling: true })

const userCooldowns = new Map<string, number>()
const COOLDOWN_MS = 5000

interface TelegramUser {
  id: string
  telegramId: string
  username: string | null
  firstName: string | null
  lastName: string | null
  freeRequestsUsed: number
  freeRequestsLimit: number
  apiKeyId: string | null
  totalPurchased: number
  starsBalance: number
}

async function getOrCreateUser(msg: TelegramBot.Message): Promise<TelegramUser> {
  const telegramId = msg.from!.id.toString()
  
  let user = await prisma.telegramUser.findUnique({
    where: { telegramId },
    include: { apiKey: true }
  })

  if (!user) {
    const apiKey = await apiKeyService.createApiKey(
      `Telegram User ${msg.from!.username || telegramId}`,
      100,
      'free'
    )

    user = await prisma.telegramUser.create({
      data: {
        telegramId,
        username: msg.from!.username || null,
        firstName: msg.from!.first_name || null,
        lastName: msg.from!.last_name || null,
        apiKeyId: apiKey.id,
        freeRequestsUsed: 0,
        freeRequestsLimit: 100
      },
      include: { apiKey: true }
    })

    await bot.sendMessage(
      msg.chat.id,
      `Welcome to MemeAPI! You've been given 100 free meme requests.\n\nUse /getmeme to get a random meme, or /buy to purchase more requests.`
    )
  }

  return {
    id: user.id,
    telegramId: user.telegramId,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    freeRequestsUsed: user.freeRequestsUsed,
    freeRequestsLimit: user.freeRequestsLimit,
    apiKeyId: user.apiKeyId,
    totalPurchased: user.totalPurchased,
    starsBalance: user.starsBalance
  }
}

async function getRemainingRequests(user: TelegramUser): Promise<number> {
  if (!user.apiKeyId) return 0
  
  const apiKey = await prisma.apiKey.findUnique({
    where: { id: user.apiKeyId }
  })
  
  if (!apiKey) return 0
  
  return Math.max(0, apiKey.requestsLimit - apiKey.requestsUsed)
}

function checkCooldown(userId: string): boolean {
  const now = Date.now()
  const lastRequest = userCooldowns.get(userId) || 0
  
  if (now - lastRequest < COOLDOWN_MS) {
    return false
  }
  
  userCooldowns.set(userId, now)
  return true
}

bot.onText(/\/start/, async (msg) => {
  await getOrCreateUser(msg)
  
  const welcomeMessage = `
Welcome to MemeAPI Bot!

Commands:
/getmeme [query] - Get a random meme
/balance - Check your remaining requests
/buy - Purchase more requests (100 stars = 1000 requests)
/docs - Download API documentation
/status - Check system status
/help - Show this message

You start with 100 free requests.
  `.trim()
  
  bot.sendMessage(msg.chat.id, welcomeMessage)
})

bot.onText(/\/help/, async (msg) => {
  const helpMessage = `
MemeAPI Bot Commands:

/getmeme [query] - Get a random meme (optional: search query)
/balance - Check your remaining requests
/buy - Purchase more requests with Telegram Stars
/docs - Download API documentation PDF
/status - Check API status
/help - Show this message

Examples:
/getmeme funny cat
/getmeme programming
  `.trim()
  
  bot.sendMessage(msg.chat.id, helpMessage)
})

bot.onText(/\/balance/, async (msg) => {
  const user = await getOrCreateUser(msg)
  const remaining = await getRemainingRequests(user)
  
  bot.sendMessage(
    msg.chat.id,
    `Your Balance:\n\nRemaining requests: ${remaining}\nFree requests used: ${user.freeRequestsUsed}/${user.freeRequestsLimit}\n\nUse /buy to purchase more requests.`
  )
})

async function sendRandomMeme(msg: TelegramBot.Message, query?: string) {
  const user = await getOrCreateUser(msg)
  
  if (!checkCooldown(user.telegramId)) {
    bot.sendMessage(msg.chat.id, 'Please wait a few seconds between requests.')
    return
  }
  
  const remaining = await getRemainingRequests(user)
  
  if (remaining <= 0) {
    bot.sendMessage(
      msg.chat.id,
      "You've used all your requests. Use /buy to purchase more."
    )
    return
  }
  
  try {
    bot.sendChatAction(msg.chat.id, 'upload_photo')
    
    const { memes } = await memeService.fetchMemes(user.apiKeyId!, {
      query: query || undefined,
      count: 1
    })
    
    if (memes.length === 0) {
      bot.sendMessage(msg.chat.id, 'No memes found. Try a different query.')
      return
    }
    
    const meme = memes[0]
    
    await bot.sendPhoto(msg.chat.id, meme.url, {
      caption: `${meme.title}\n\nUpvotes: ${meme.upvotes.toLocaleString()} | r/${meme.subreddit}`,
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'View on Reddit', url: meme.permalink },
            { text: 'Get Another', callback_data: 'get_another' }
          ]
        ]
      }
    })
    
    const newRemaining = await getRemainingRequests(user)
    
    if (newRemaining <= 10) {
      bot.sendMessage(
        msg.chat.id,
        `You have ${newRemaining} requests remaining. Use /buy to purchase more.`
      )
    }
  } catch (error) {
    console.error('Error fetching meme:', error)
    bot.sendMessage(msg.chat.id, 'Sorry, could not fetch a meme. Please try again later.')
  }
}

bot.onText(/\/getmeme(?:\s+(.+))?/, async (msg, match) => {
  const query = match?.[1]
  await sendRandomMeme(msg, query || undefined)
})

bot.onText(/\/buy/, async (msg) => {
  const prices = [
    { label: '1000 requests', amount: 100 },
    { label: '5000 requests', amount: 450 },
    { label: '10000 requests', amount: 800 }
  ]
  
  const keyboard = prices.map(p => ([{
    text: `${p.label} - ${p.amount} Stars`,
    callback_data: `buy_${p.amount}_${p.label.split(' ')[0]}`
  }]))
  
  bot.sendMessage(
    msg.chat.id,
    'Purchase MemeAPI Requests:\n\n100 Stars = 1000 requests\nSelect a package below:',
    {
      reply_markup: {
        inline_keyboard: keyboard
      }
    }
  )
})

bot.onText(/\/status/, async (msg) => {
  try {
    const response = await fetch('http://localhost:3000/api/health')
    const health = await response.json()
    
    const status = health.status === 'healthy' ? 'Operational' : 'Issues Detected'
    const emoji = health.status === 'healthy' ? '' : ''
    
    bot.sendMessage(
      msg.chat.id,
      `System Status: ${emoji} ${status}\n\nDatabase: ${health.checks.database ? 'Connected' : 'Disconnected'}\nReddit: ${health.checks.reddit ? 'Connected' : 'Disconnected'}\n\nLast checked: ${new Date().toLocaleString()}`
    )
  } catch {
    bot.sendMessage(
      msg.chat.id,
      'Unable to check status. The API may be temporarily unavailable.'
    )
  }
})

bot.onText(/\/stats/, async (msg) => {
  const user = await getOrCreateUser(msg)
  
  try {
    const totalSpent = await prisma.payment.aggregate({
      where: {
        telegramId: user.telegramId,
        status: 'completed'
      },
      _sum: {
        amount: true
      }
    })

    const remaining = await getRemainingRequests(user)
    const apiKey = user.apiKeyId ? await prisma.apiKey.findUnique({
      where: { id: user.apiKeyId }
    }) : null

    const statsMessage = `
Your MemeAPI Statistics

Free Requests:
  Used: ${user.freeRequestsUsed}/${user.freeRequestsLimit}

Purchased:
  Total Stars Spent: ${totalSpent._sum.amount || 0} 
  Total Requests Purchased: ${user.totalPurchased.toLocaleString()}

Current Usage:
  Requests Used: ${apiKey?.requestsUsed?.toLocaleString() || 0}
  Remaining: ${typeof remaining === 'number' ? remaining.toLocaleString() : remaining}

Stars Balance: ${user.starsBalance}
    `.trim()

    bot.sendMessage(msg.chat.id, statsMessage)
  } catch (error) {
    console.error('Error fetching stats:', error)
    bot.sendMessage(msg.chat.id, 'Sorry, could not fetch your statistics. Please try again later.')
  }
})

bot.onText(/\/docs/, async (msg) => {
  const docsText = `
MemeAPI Documentation

Base URL: https://your-domain.com/api

ENDPOINTS:

1. GET /memes
   Fetch memes with filtering options.
   
   Parameters:
   - apiKey (required): Your API key
   - query (optional): Search query
   - subreddit (optional): Specific subreddit
   - count (optional): Number of memes (1-50, default: 10)
   - minUpvotes (optional): Minimum upvote count
   - maxUpvotes (optional): Maximum upvote count
   - sort (optional): hot, top, new (default: hot)
   - nsfw (optional): true/false (default: false)

2. GET /memes/image
   Returns only the image (useful for embedding).
   Same parameters as /memes, but returns image directly.

RESPONSE FORMAT:
{
  "success": true,
  "data": {
    "memes": [...],
    "meta": {
      "returned": 10,
      "remainingRequests": 990
    }
  }
}

Rate limits vary by tier:
- Free: 10 requests/minute
- Standard: 60 requests/minute  
- Premium: 300 requests/minute

For support, contact the admin.
  `.trim()
  
  bot.sendMessage(msg.chat.id, docsText)
})

bot.on('callback_query', async (query) => {
  const msg = query.message
  if (!msg) return
  
  const data = query.data
  
  if (data === 'get_another') {
    bot.answerCallbackQuery(query.id)
    await sendRandomMeme(msg)
    return
  }
  
  if (data?.startsWith('buy_')) {
    const parts = data.split('_')
    const amount = parseInt(parts[1])
    const requests = parts[2]
    
    bot.answerCallbackQuery(query.id)
    
    await bot.sendInvoice(
      msg.chat.id,
      `${requests} MemeAPI Requests`,
      `Purchase ${requests} meme requests for your API key`,
      `payment_${Date.now()}`,
      '',
      'XTR',
      [{ label: `${requests} Requests`, amount: amount }],
      {
        need_name: false,
        need_phone_number: false,
        need_email: false,
        need_shipping_address: false,
        is_flexible: false
      }
    )
  }
})

bot.on('pre_checkout_query', async (query) => {
  bot.answerPreCheckoutQuery(query.id, true)
})

bot.on('successful_payment', async (msg) => {
  const payment = msg.successful_payment!
  const user = await getOrCreateUser(msg)
  
  const amount = payment.total_amount
  const requestsToAdd = amount * 10
  
  if (user.apiKeyId) {
    await prisma.apiKey.update({
      where: { id: user.apiKeyId },
      data: {
        requestsLimit: { increment: requestsToAdd }
      }
    })
  }
  
  await prisma.telegramUser.update({
    where: { telegramId: user.telegramId },
    data: {
      totalPurchased: { increment: requestsToAdd },
      starsBalance: { increment: amount }
    }
  })
  
  await prisma.payment.create({
    data: {
      telegramId: user.telegramId,
      amount: amount,
      requestsAdded: requestsToAdd,
      status: 'completed',
      telegramPaymentId: payment.telegram_payment_charge_id,
      completedAt: new Date()
    }
  })
  
  const newRemaining = await getRemainingRequests(user)
  
  bot.sendMessage(
    msg.chat.id,
    `Payment successful! Added ${requestsToAdd} requests to your account.\n\nYour new balance: ${newRemaining} requests\n\nTransaction ID: ${payment.telegram_payment_charge_id}`
  )
})

bot.on('inline_query', async (query) => {
  const searchQuery = query.query
  
  if (!searchQuery) {
    bot.answerInlineQuery(query.id, [])
    return
  }
  
  try {
    const { memes } = await memeService.fetchMemes('system', {
      query: searchQuery,
      count: 5
    })
    
    const results = memes.map((meme, index) => ({
      type: 'photo' as const,
      id: `${meme.id}_${index}`,
      photo_url: meme.url,
      thumb_url: meme.thumbnail || meme.url,
      title: meme.title,
      description: `r/${meme.subreddit} - ${meme.upvotes.toLocaleString()} upvotes`,
      caption: `${meme.title}\n\n${meme.permalink}`
    }))
    
    bot.answerInlineQuery(query.id, results, {
      is_personal: true,
      cache_time: 300
    })
  } catch (error) {
    console.error('Inline query error:', error)
    bot.answerInlineQuery(query.id, [])
  }
})

console.log('Telegram bot started successfully')
