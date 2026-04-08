import Link from 'next/link'
import { Zap, Shield, Globe, Code } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="environment" />
      
      <nav className="glass fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 flex items-center gap-8">
        <div className="flex items-center gap-2 text-white font-medium">
          <Zap className="w-5 h-5" />
          MemeAPI
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-white/50">
          <span>Features</span>
          <span>Pricing</span>
          <span>Documentation</span>
        </div>
        <Link 
          href="/dashboard/login"
          className="text-sm text-white/80 hover:text-white transition-colors"
        >
          Admin
        </Link>
      </nav>

      <main className="relative z-10 pt-32 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h1 className="text-5xl md:text-7xl font-light text-white mb-6 leading-tight">
              Premium Meme API
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto mb-8">
              High-quality memes from Reddit delivered instantly. 
              Advanced filtering, deduplication, and rate limiting included.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/dashboard/login"
                className="px-8 py-4 rounded-full bg-white/10 border border-white/20 text-white font-medium hover:bg-white/15 transition-colors"
              >
                Get Started
              </Link>
              <a
                href="#docs"
                className="px-8 py-4 rounded-full border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-colors"
              >
                View Docs
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            <FeatureCard
              icon={<Globe className="w-6 h-6" />}
              title="Reddit Integration"
              description="Direct access to popular meme subreddits with real-time scraping and intelligent caching."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Smart Deduplication"
              description="Never see the same meme twice. Our system tracks and filters duplicates automatically."
            />
            <FeatureCard
              icon={<Code className="w-6 h-6" />}
              title="Simple API"
              description="RESTful endpoints with comprehensive documentation. Get started in minutes."
            />
          </div>

          <div className="glass p-8 md:p-12" id="docs">
            <h2 className="text-2xl font-light text-white mb-6">Quick Start</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm uppercase tracking-wider text-white/50 mb-3">
                  1. Get an API Key
                </h3>
                <p className="text-white/70">
                  Sign in to the admin dashboard and create your first API key.
                </p>
              </div>

              <div>
                <h3 className="text-sm uppercase tracking-wider text-white/50 mb-3">
                  2. Make a Request
                </h3>
                <div className="bg-black/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <span className="text-green-400">GET</span>
                  <span className="text-white/70"> /api/memes?apiKey=YOUR_KEY&count=10</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm uppercase tracking-wider text-white/50 mb-3">
                  3. Receive Memes
                </h3>
                <pre className="bg-black/50 rounded-lg p-4 text-sm overflow-x-auto text-white/70">
{`{
  "success": true,
  "data": {
    "memes": [
      {
        "id": "...",
        "title": "Funny meme title",
        "url": "https://i.redd.it/...",
        "upvotes": 15000
      }
    ]
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode
  title: string
  description: string 
}) {
  return (
    <div className="glass p-6">
      <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-white mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      <p className="text-white/50 text-sm leading-relaxed">{description}</p>
    </div>
  )
}
