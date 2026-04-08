# MemeAPI

High-performance meme API service with Reddit integration, Next.js dashboard, and Telegram bot.

## Features

- Reddit meme scraping with smart caching
- REST API with JSON and image-only endpoints
- Rate limiting with tiered access (Free/Standard/Premium)
- Smart deduplication (never see same meme twice)
- Admin dashboard with glassmorphism design
- Telegram bot with Stars payment integration
- Infinite API keys support

## Quick Start

### Local Development

```bash
npm install
npm run db:migrate
npm run dev
```

### Environment Variables

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
DATABASE_URL=postgresql://...
TELEGRAM_BOT_TOKEN=your_bot_token  # optional
```

### API Usage

```bash
# Get memes
curl "/api/memes?apiKey=YOUR_KEY&count=10"

# Get image only
curl "/api/memes/image?apiKey=YOUR_KEY"
```

### Telegram Bot Commands

- `/start` - Get 100 free requests
- `/getmeme [query]` - Random meme
- `/balance` - Check credits
- `/buy` - Purchase with Stars
- `/stats` - View statistics

## Deployment

Deploy to Railway:
1. Connect GitHub repo
2. Add PostgreSQL database
3. Set environment variables
4. Deploy

## Documentation

Visit `/docs` on your deployed instance for full API documentation.

## License

Private
