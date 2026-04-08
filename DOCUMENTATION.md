# MemeAPI Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Quick Start](#quick-start)
3. [Authentication](#authentication)
4. [API Endpoints](#api-endpoints)
5. [Rate Limiting](#rate-limiting)
6. [Deduplication](#deduplication)
7. [Response Format](#response-format)
8. [Error Handling](#error-handling)
9. [Telegram Bot](#telegram-bot)
10. [Dashboard](#dashboard)
11. [Testing](#testing)
12. [Examples](#examples)
13. [Technical Details](#technical-details)

---

## Introduction

MemeAPI is a high-performance REST API service that provides programmatic access to memes from Reddit. It features intelligent caching, smart deduplication, flexible filtering, and comprehensive rate limiting.

### Key Features

- **Reddit Integration**: Direct access to popular meme subreddits with real-time scraping
- **Smart Deduplication**: Never receive the same meme twice (tracks last 100 per API key)
- **Flexible Filtering**: Filter by subreddit, upvotes, search queries, and more
- **Image-Only Mode**: Direct image delivery for embedding
- **Rate Limiting**: Tiered access levels (Free, Standard, Premium)
- **Telegram Bot**: Manage your API access and purchase requests via Telegram
- **Admin Dashboard**: Glassmorphism-styled management interface

---

## Quick Start

### 1. Installation

```bash
# Clone or create the project
cd memeapi

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Edit .env with your credentials:
# ADMIN_USERNAME=admin
# ADMIN_PASSWORD=secure_password
# DATABASE_URL=postgresql://...
# TELEGRAM_BOT_TOKEN=your_bot_token

# Run database migrations
npm run db:migrate

# Start the development server
npm run dev

# Start the Telegram bot (in another terminal)
npm run bot
```

### 2. Get an API Key

1. Visit `http://localhost:3000/dashboard/login`
2. Log in with your admin credentials
3. Navigate to "API Keys" section
4. Click "Create Key" and configure settings
5. Copy your API key

### 3. Make Your First Request

```bash
curl "http://localhost:3000/api/memes?apiKey=YOUR_KEY&count=5"
```

---

## Authentication

All API requests require an API key passed as a query parameter.

### Parameter

- `apiKey` (required): Your unique API key

### Example

```
GET /api/memes?apiKey=meme_abc123...
```

### Response on Invalid Key

```json
{
  "success": false,
  "error": "Invalid or expired API key"
}
```

---

## API Endpoints

### 1. GET /api/memes

Fetch memes with full metadata.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| apiKey | string | Yes | - | Your API key |
| query | string | No | - | Search query for meme titles |
| subreddit | string | No | - | Specific subreddit (e.g., "memes") |
| count | integer | No | 10 | Number of memes (1-50) |
| minUpvotes | integer | No | - | Minimum upvote count |
| maxUpvotes | integer | No | - | Maximum upvote count |
| sort | string | No | hot | Sort order: hot, top, new |
| nsfw | boolean | No | false | Include NSFW content |

#### Example Request

```bash
curl "http://localhost:3000/api/memes?apiKey=meme_abc123&query=funny&count=5&minUpvotes=1000&sort=hot"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "memes": [
      {
        "id": "t3_abc123",
        "title": "When you finally fix that bug",
        "url": "https://i.redd.it/example.jpg",
        "permalink": "https://reddit.com/r/ProgrammerHumor/comments/abc123/...",
        "subreddit": "ProgrammerHumor",
        "author": "developer42",
        "upvotes": 15432,
        "upvoteRatio": 0.96,
        "comments": 342,
        "createdAt": "2024-01-15T10:30:00Z",
        "isNsfw": false,
        "thumbnail": "https://b.thumbs.redditmedia.com/..."
      }
    ],
    "meta": {
      "returned": 1,
      "remainingRequests": 999,
      "source": "reddit",
      "cached": false
    }
  }
}
```

#### Response Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1705312800
X-Remaining-Requests: 999
```

---

### 2. GET /api/memes/image

Returns only the image for direct embedding. Perfect for Discord bots, websites, or applications that just need the image file.

#### Query Parameters

Same as `/api/memes`, but only returns the first matching meme as an image.

#### Example Request

```bash
curl "http://localhost:3000/api/memes/image?apiKey=meme_abc123&query=cat" \
  --output meme.jpg
```

#### Response

- **Success**: Returns image bytes with appropriate Content-Type header
- **Headers**:
  - `Content-Type`: image/jpeg, image/png, image/gif, etc.
  - `X-Meme-Title`: URL-encoded meme title
  - `X-Meme-Subreddit`: Subreddit name
  - `X-Meme-Upvotes`: Upvote count
  - `Cache-Control`: public, max-age=300

#### Example HTML Usage

```html
<img src="http://localhost:3000/api/memes/image?apiKey=meme_abc123&query=funny" 
     alt="Random meme" />
```

---

### 3. GET /api/health

Check API health status.

#### Example Request

```bash
curl "http://localhost:3000/api/health"
```

#### Example Response

```json
{
  "status": "healthy",
  "checks": {
    "database": true,
    "reddit": true,
    "timestamp": "2024-01-15T12:00:00.000Z"
  }
}
```

---

## Rate Limiting

### Tiers

| Tier | Requests/Minute | Requests/Hour | Requests/Day | Best For |
|------|----------------|---------------|--------------|----------|
| Free | 10 | 100 | 500 | Testing, personal use |
| Standard | 60 | 1,000 | 5,000 | Small applications |
| Premium | 300 | 5,000 | 25,000 | High-traffic apps |

### Headers

Every response includes rate limit headers:

- `X-RateLimit-Limit`: Maximum requests allowed per minute
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

### Rate Limit Response

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "resetAt": "2024-01-15T12:01:00.000Z"
}
```

Status code: `429 Too Many Requests`

---

## Deduplication

MemeAPI implements intelligent deduplication to ensure users don't receive duplicate memes.

### How It Works

1. **Tracking**: Each API key tracks the last 100 memes returned
2. **Filtering**: New requests exclude recently seen memes
3. **Recycling**: If insufficient fresh memes exist, oldest seen memes are returned
4. **Persistence**: Tracked in database for consistency across requests

### Algorithm

```
1. Fetch candidates from Reddit
2. Filter by user parameters (upvotes, subreddit, etc.)
3. Remove last 100 seen memes for this API key
4. If insufficient memes remain:
   a. From excluded list, select oldest by lastReturnedAt
   b. Update their return timestamp
5. Return selected memes
6. Persist to seen memes list
```

### Benefits

- No duplicate memes in consecutive requests
- Memory-efficient (only 100 per API key)
- Automatic cleanup of old entries
- Seamless recycling when needed

---

## Response Format

### Success Response Structure

```typescript
{
  success: true,
  data: {
    memes: Meme[],
    meta: {
      returned: number,        // Number of memes returned
      remainingRequests: number, // Remaining quota
      source: string,          // "reddit" or "cache"
      cached: boolean          // Whether from cache
    }
  }
}
```

### Meme Object

```typescript
interface Meme {
  id: string;              // Reddit post ID
  title: string;           // Post title
  url: string;             // Direct image URL
  permalink: string;       // Reddit post URL
  subreddit: string;       // Source subreddit
  author: string;          // Reddit username
  upvotes: number;         // Upvote count
  upvoteRatio: number;     // Upvote ratio (0-1)
  comments: number;        // Comment count
  createdAt: string;       // ISO timestamp
  isNsfw: boolean;         // NSFW flag
  thumbnail?: string;      // Thumbnail URL
}
```

---

## Error Handling

### Error Response Structure

```json
{
  "success": false,
  "error": "Description of what went wrong",
  "details": {} // Optional additional details
}
```

### Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Successful request |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Invalid API key |
| 404 | Not Found | No memes match criteria |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Common Errors

**Invalid Parameters**
```json
{
  "success": false,
  "error": "Invalid parameters",
  "details": [
    { "path": ["count"], "message": "Number must be less than or equal to 50" }
  ]
}
```

**Rate Limited**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "resetAt": "2024-01-15T12:01:00.000Z"
}
```

**Quota Exceeded**
```json
{
  "success": false,
  "error": "Invalid or expired API key"
}
```

---

## Telegram Bot

The Telegram bot provides convenient access to the MemeAPI and request purchasing.

### Commands

| Command | Description |
|---------|-------------|
| `/start` | Initialize bot, get 100 free requests |
| `/help` | Show all commands |
| `/balance` | Check remaining requests |
| `/buy` | Purchase more requests with Telegram Stars |
| `/getmeme [query]` | Get a random meme (optional search) |
| `/status` | Check API health |
| `/docs` | View documentation |

### Getting Started

1. Find your bot on Telegram (requires `TELEGRAM_BOT_TOKEN` in .env)
2. Send `/start` to receive 100 free requests
3. Use `/getmeme` to fetch memes
4. Use `/buy` to purchase more requests

### Pricing

- **100 Stars** = 1,000 requests
- **450 Stars** = 5,000 requests (10% discount)
- **800 Stars** = 10,000 requests (20% discount)

### Inline Queries

Type `@YourBotName funny cat` in any chat to search memes inline.

---

## Dashboard

The admin dashboard provides visual management of the MemeAPI service.

### Features

#### Overview Panel
- Total requests (today/week/month)
- Active API keys count
- Top search queries
- Top subreddits
- Average response time
- Error rate

#### API Key Management
- Create new keys
- View usage statistics per key
- Revoke keys
- Set rate limit tiers
- Configure request limits

#### Access

1. Navigate to `http://localhost:3000/dashboard/login`
2. Log in with admin credentials
3. Manage your API service

---

## Testing

A built-in testing dashboard is included for easy API testing.

### Starting the Test Server

```bash
# From project root
cd testing
./start.sh

# Server starts at http://localhost:8080
```

### Stopping the Test Server

```bash
./stop.sh
```

### Features

- **Parameter Builder**: GUI for constructing API requests
- **JSON Response Viewer**: Formatted response display
- **Image Preview**: Direct image visualization
- **Request History**: Track previous requests
- **Statistics**: Response time and metadata tracking
- **Health Monitoring**: Check API status

---

## Examples

### JavaScript/TypeScript

```typescript
// Fetch memes with filtering
async function getMemes() {
  const params = new URLSearchParams({
    apiKey: 'meme_abc123',
    query: 'programming',
    count: '5',
    minUpvotes: '1000',
    sort: 'hot'
  });
  
  const response = await fetch(`http://localhost:3000/api/memes?${params}`);
  const data = await response.json();
  
  if (data.success) {
    return data.data.memes;
  }
  throw new Error(data.error);
}

// Get image only
function getMemeImageUrl(): string {
  const params = new URLSearchParams({
    apiKey: 'meme_abc123',
    query: 'funny'
  });
  return `http://localhost:3000/api/memes/image?${params}`;
}
```

### Python

```python
import requests

def get_memes(api_key, query=None, count=10):
    url = "http://localhost:3000/api/memes"
    params = {
        'apiKey': api_key,
        'count': count
    }
    if query:
        params['query'] = query
    
    response = requests.get(url, params=params)
    data = response.json()
    
    if data['success']:
        return data['data']['memes']
    raise Exception(data['error'])

def download_meme(api_key, query=None):
    url = "http://localhost:3000/api/memes/image"
    params = {'apiKey': api_key}
    if query:
        params['query'] = query
    
    response = requests.get(url, params=params)
    with open('meme.jpg', 'wb') as f:
        f.write(response.content)
    return 'meme.jpg'
```

### cURL

```bash
# Get JSON response
curl "http://localhost:3000/api/memes?apiKey=meme_abc123&count=5"

# Download image
curl "http://localhost:3000/api/memes/image?apiKey=meme_abc123" \
  --output random_meme.jpg

# Filter by subreddit and upvotes
curl "http://localhost:3000/api/memes?apiKey=meme_abc123&subreddit=dankmemes&minUpvotes=5000"
```

### Discord Bot Integration

```javascript
const { Client, GatewayIntentBits } = require('discord.js');

client.on('messageCreate', async (message) => {
  if (message.content.startsWith('!meme')) {
    const query = message.content.slice(5).trim();
    const params = new URLSearchParams({
      apiKey: process.env.MEME_API_KEY,
      count: '1'
    });
    if (query) params.append('query', query);
    
    const imageUrl = `http://localhost:3000/api/memes/image?${params}`;
    message.channel.send({ content: 'Here is your meme:', files: [imageUrl] });
  }
});
```

---

## Technical Details

### Architecture

```
Client Request
    |
    v
Rate Limiter -> Check limits
    |
    v
API Key Validator -> Validate & track usage
    |
    v
Meme Service -> Deduplication logic
    |
    v
Reddit Service -> Scrape/cache memes
    |
    v
Response
```

### Caching Strategy

- **In-Memory LRU**: 5-minute cache for Reddit responses
- **Database Cache**: Persistent storage of meme metadata
- **Cache Key**: `{subreddit}:{sort}`
- **Background Refresh**: Cache refreshed before expiry

### Database Schema

**Key Tables:**
- `api_keys`: API key management
- `meme_requests`: Request logging
- `api_key_seen_memes`: Deduplication tracking
- `telegram_users`: Telegram bot users
- `payments`: Purchase history
- `meme_cache`: Persistent meme storage

### Security

- **API Keys**: UUID v4 format, unique per user
- **Rate Limiting**: Per-key tracking with Redis-like TTL
- **Input Validation**: Zod schemas for all endpoints
- **SQL Injection**: Prisma ORM protection
- **Authentication**: bcrypt password hashing
- **Sessions**: HTTP-only cookies with iron-session

### Environment Variables

```bash
# Required
ADMIN_USERNAME=admin              # Dashboard login username
ADMIN_PASSWORD=secure_password    # Dashboard login password
DATABASE_URL=postgresql://...     # PostgreSQL connection string
TELEGRAM_BOT_TOKEN=bot_token      # Telegram bot token (optional)

# Optional
SESSION_SECRET=random_string      # Session encryption key
NODE_ENV=production               # Environment mode
```

### Performance

- **Response Time**: ~100-500ms average
- **Cache Hit**: ~50-100ms
- **Concurrent Requests**: 100+ per second
- **Memory Usage**: ~200MB base

### Supported Subreddits

Default subreddits for general meme fetching:
- r/memes
- r/dankmemes
- r/funny
- r/wholesomememes
- r/me_irl
- r/ProgrammerHumor
- r/AdviceAnimals

---

## Support

For issues, questions, or feature requests:

1. Check this documentation
2. Use the Telegram bot `/help` command
3. Visit the admin dashboard
4. Check API health at `/api/health`

---

## License

Private use only. All rights reserved.

---

**Version**: 1.0.0  
**Last Updated**: 2024
