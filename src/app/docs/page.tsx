'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Zap, 
  Copy, 
  Check, 
  ChevronRight,
  Code,
  Terminal,
  Book,
  Key,
  Activity
} from 'lucide-react'

export default function DocsPage() {
  const [copiedExample, setCopiedExample] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedExample(id)
    setTimeout(() => setCopiedExample(null), 2000)
  }

  return (
    <div className="min-h-screen relative">
      <div className="environment" />
      
      <nav className="glass fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 text-white font-medium">
          <Zap className="w-5 h-5" />
          MemeAPI
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-white/50">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span className="text-white">Documentation</span>
          <Link href="/dashboard/login" className="hover:text-white transition-colors">Dashboard</Link>
        </div>
        <div className="text-xs text-white/30 font-mono">v1.0.0</div>
      </nav>

      <main className="relative z-10 pt-32 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-light text-white mb-4">
              API Documentation
            </h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Complete reference for the MemeAPI. Build amazing applications with high-quality memes from Reddit.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <aside className="lg:col-span-1">
              <div className="glass p-6 sticky top-24">
                <h3 className="text-sm uppercase tracking-wider text-white/50 mb-4 flex items-center gap-2">
                  <Book className="w-4 h-4" />
                  Contents
                </h3>
                <nav className="space-y-1">
                  <a href="#authentication" className="block py-2 px-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors text-sm">
                    Authentication
                  </a>
                  <a href="#endpoints" className="block py-2 px-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors text-sm">
                    Endpoints
                  </a>
                  <a href="#parameters" className="block py-2 px-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors text-sm pl-6">
                    Parameters
                  </a>
                  <a href="#response" className="block py-2 px-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors text-sm pl-6">
                    Response Format
                  </a>
                  <a href="#rate-limiting" className="block py-2 px-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors text-sm">
                    Rate Limiting
                  </a>
                  <a href="#examples" className="block py-2 px-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors text-sm">
                    Code Examples
                  </a>
                  <a href="#telegram" className="block py-2 px-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors text-sm">
                    Telegram Bot
                  </a>
                  <a href="#errors" className="block py-2 px-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors text-sm">
                    Error Handling
                  </a>
                </nav>
              </div>
            </aside>

            <div className="lg:col-span-3 space-y-12">
              <section id="authentication" className="glass p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Key className="w-6 h-6 text-white/70" />
                  <h2 className="text-2xl font-light text-white">Authentication</h2>
                </div>
                
                <p className="text-white/70 mb-6">
                  All API requests require an API key passed as a query parameter. 
                  Get your API key from the admin dashboard.
                </p>

                <div className="bg-black/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-wider text-white/50">Query Parameter</span>
                    <button
                      onClick={() => copyToClipboard('apiKey=YOUR_API_KEY', 'auth')}
                      className="text-white/50 hover:text-white transition-colors"
                    >
                      {copiedExample === 'auth' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <code className="text-green-400 font-mono text-sm">apiKey=YOUR_API_KEY</code>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-300 text-sm">
                    Keep your API key secure. Do not share it publicly or commit it to version control.
                  </p>
                </div>
              </section>

              <section id="endpoints" className="glass p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Code className="w-6 h-6 text-white/70" />
                  <h2 className="text-2xl font-light text-white">Endpoints</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-mono">GET</span>
                      <code className="text-white font-mono">/api/memes</code>
                    </div>
                    <p className="text-white/60 text-sm mb-3">
                      Fetch memes with full metadata. Returns JSON response with meme data.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-mono">GET</span>
                      <code className="text-white font-mono">/api/memes/image</code>
                    </div>
                    <p className="text-white/60 text-sm mb-3">
                      Returns only the image file. Perfect for direct embedding in HTML or apps.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-mono">GET</span>
                      <code className="text-white font-mono">/api/health</code>
                    </div>
                    <p className="text-white/60 text-sm mb-3">
                      Check API health status. No authentication required.
                    </p>
                  </div>
                </div>
              </section>

              <section id="parameters" className="glass p-8">
                <h2 className="text-2xl font-light text-white mb-6">Parameters</h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-white/50 font-medium">Parameter</th>
                        <th className="text-left py-3 px-4 text-white/50 font-medium">Type</th>
                        <th className="text-left py-3 px-4 text-white/50 font-medium">Required</th>
                        <th className="text-left py-3 px-4 text-white/50 font-medium">Default</th>
                        <th className="text-left py-3 px-4 text-white/50 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr>
                        <td className="py-3 px-4 text-white font-mono text-xs">apiKey</td>
                        <td className="py-3 px-4 text-white/70">string</td>
                        <td className="py-3 px-4"><span className="text-red-400">Yes</span></td>
                        <td className="py-3 px-4 text-white/50">-</td>
                        <td className="py-3 px-4 text-white/70">Your API key</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-white font-mono text-xs">query</td>
                        <td className="py-3 px-4 text-white/70">string</td>
                        <td className="py-3 px-4"><span className="text-white/50">No</span></td>
                        <td className="py-3 px-4 text-white/50">-</td>
                        <td className="py-3 px-4 text-white/70">Search query for meme titles</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-white font-mono text-xs">subreddit</td>
                        <td className="py-3 px-4 text-white/70">string</td>
                        <td className="py-3 px-4"><span className="text-white/50">No</span></td>
                        <td className="py-3 px-4 text-white/50">-</td>
                        <td className="py-3 px-4 text-white/70">Specific subreddit (e.g., "memes")</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-white font-mono text-xs">count</td>
                        <td className="py-3 px-4 text-white/70">integer</td>
                        <td className="py-3 px-4"><span className="text-white/50">No</span></td>
                        <td className="py-3 px-4 text-white/50">10</td>
                        <td className="py-3 px-4 text-white/70">Number of memes (1-50)</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-white font-mono text-xs">minUpvotes</td>
                        <td className="py-3 px-4 text-white/70">integer</td>
                        <td className="py-3 px-4"><span className="text-white/50">No</span></td>
                        <td className="py-3 px-4 text-white/50">-</td>
                        <td className="py-3 px-4 text-white/70">Minimum upvote count</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-white font-mono text-xs">maxUpvotes</td>
                        <td className="py-3 px-4 text-white/70">integer</td>
                        <td className="py-3 px-4"><span className="text-white/50">No</span></td>
                        <td className="py-3 px-4 text-white/50">-</td>
                        <td className="py-3 px-4 text-white/70">Maximum upvote count</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-white font-mono text-xs">sort</td>
                        <td className="py-3 px-4 text-white/70">string</td>
                        <td className="py-3 px-4"><span className="text-white/50">No</span></td>
                        <td className="py-3 px-4 text-white/50">hot</td>
                        <td className="py-3 px-4 text-white/70">hot, top, or new</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-white font-mono text-xs">nsfw</td>
                        <td className="py-3 px-4 text-white/70">boolean</td>
                        <td className="py-3 px-4"><span className="text-white/50">No</span></td>
                        <td className="py-3 px-4 text-white/50">false</td>
                        <td className="py-3 px-4 text-white/70">Include NSFW content</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section id="response" className="glass p-8">
                <h2 className="text-2xl font-light text-white mb-6">Response Format</h2>

                <p className="text-white/70 mb-4">Successful response structure:</p>

                <div className="bg-black/30 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-white/80 font-mono">{`{
  "success": true,
  "data": {
    "memes": [
      {
        "id": "t3_abc123",
        "title": "When you finally fix that bug",
        "url": "https://i.redd.it/example.jpg",
        "permalink": "https://reddit.com/r/...",
        "subreddit": "ProgrammerHumor",
        "author": "developer42",
        "upvotes": 15432,
        "upvoteRatio": 0.96,
        "comments": 342,
        "createdAt": "2024-01-15T10:30:00Z",
        "isNsfw": false
      }
    ],
    "meta": {
      "returned": 1,
      "remainingRequests": 999,
      "source": "reddit",
      "cached": false
    }
  }
}`}</pre>
                </div>

                <h3 className="text-lg font-medium text-white mt-6 mb-3">Response Headers</h3>
                <div className="bg-black/30 rounded-lg p-4">
                  <ul className="space-y-2 text-sm text-white/70 font-mono">
                    <li>X-RateLimit-Limit: 60</li>
                    <li>X-RateLimit-Remaining: 59</li>
                    <li>X-RateLimit-Reset: 1705312800</li>
                    <li>X-Remaining-Requests: 999</li>
                  </ul>
                </div>
              </section>

              <section id="rate-limiting" className="glass p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Activity className="w-6 h-6 text-white/70" />
                  <h2 className="text-2xl font-light text-white">Rate Limiting</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="text-2xl font-light text-white mb-1">10</div>
                    <div className="text-sm text-white/50">Requests/min (Free)</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="text-2xl font-light text-white mb-1">60</div>
                    <div className="text-sm text-white/50">Requests/min (Standard)</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="text-2xl font-light text-white mb-1">300</div>
                    <div className="text-sm text-white/50">Requests/min (Premium)</div>
                  </div>
                </div>

                <p className="text-white/70 text-sm">
                  Rate limit information is included in response headers. If you exceed the limit, 
                  you will receive a 429 status code with the reset time.
                </p>
              </section>

              <section id="examples" className="glass p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Terminal className="w-6 h-6 text-white/70" />
                  <h2 className="text-2xl font-light text-white">Code Examples</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm uppercase tracking-wider text-white/50 mb-3">cURL</h3>
                    <div className="bg-black/30 rounded-lg p-4 relative">
                      <button
                        onClick={() => copyToClipboard(`curl "https://your-api.com/api/memes?apiKey=YOUR_KEY&count=5"`, 'curl')}
                        className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors"
                      >
                        {copiedExample === 'curl' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <pre className="text-sm text-white/80 font-mono overflow-x-auto">{`curl "https://your-api.com/api/memes?apiKey=YOUR_KEY&count=5"`}</pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm uppercase tracking-wider text-white/50 mb-3">JavaScript</h3>
                    <div className="bg-black/30 rounded-lg p-4 relative">
                      <button
                        onClick={() => copyToClipboard(`const response = await fetch('https://your-api.com/api/memes?apiKey=YOUR_KEY&count=5');
const data = await response.json();
console.log(data.data.memes);`, 'js')}
                        className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors"
                      >
                        {copiedExample === 'js' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <pre className="text-sm text-white/80 font-mono overflow-x-auto">{`const response = await fetch('https://your-api.com/api/memes?apiKey=YOUR_KEY&count=5');
const data = await response.json();
console.log(data.data.memes);`}</pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm uppercase tracking-wider text-white/50 mb-3">Python</h3>
                    <div className="bg-black/30 rounded-lg p-4 relative">
                      <button
                        onClick={() => copyToClipboard(`import requests

response = requests.get('https://your-api.com/api/memes', params={
    'apiKey': 'YOUR_KEY',
    'count': 5
})
data = response.json()
print(data['data']['memes'])`, 'python')}
                        className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors"
                      >
                        {copiedExample === 'python' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <pre className="text-sm text-white/80 font-mono overflow-x-auto">{`import requests

response = requests.get('https://your-api.com/api/memes', params={
    'apiKey': 'YOUR_KEY',
    'count': 5
})
data = response.json()
print(data['data']['memes'])`}</pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm uppercase tracking-wider text-white/50 mb-3">HTML Embed</h3>
                    <div className="bg-black/30 rounded-lg p-4 relative">
                      <button
                        onClick={() => copyToClipboard(`<img src="https://your-api.com/api/memes/image?apiKey=YOUR_KEY" alt="Random meme" />`, 'html')}
                        className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors"
                      >
                        {copiedExample === 'html' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <pre className="text-sm text-white/80 font-mono overflow-x-auto">{`<img src="https://your-api.com/api/memes/image?apiKey=YOUR_KEY" alt="Random meme" />`}</pre>
                    </div>
                  </div>
                </div>
              </section>

              <section id="telegram" className="glass p-8">
                <h2 className="text-2xl font-light text-white mb-6">Telegram Bot</h2>

                <p className="text-white/70 mb-6">
                  Manage your API access and purchase requests via Telegram.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <code className="text-green-400 font-mono text-sm">/start</code>
                    <span className="text-white/70 text-sm">Initialize bot and get 100 free requests</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <code className="text-green-400 font-mono text-sm">/getmeme</code>
                    <span className="text-white/70 text-sm">Get a random meme (optional: add search query)</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <code className="text-green-400 font-mono text-sm">/balance</code>
                    <span className="text-white/70 text-sm">Check remaining requests</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <code className="text-green-400 font-mono text-sm">/buy</code>
                    <span className="text-white/70 text-sm">Purchase more requests with Telegram Stars</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <code className="text-green-400 font-mono text-sm">/stats</code>
                    <span className="text-white/70 text-sm">View your usage statistics</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <code className="text-green-400 font-mono text-sm">/status</code>
                    <span className="text-white/70 text-sm">Check API health</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    <strong>Pricing:</strong> 100 Stars = 1,000 requests
                  </p>
                </div>
              </section>

              <section id="errors" className="glass p-8">
                <h2 className="text-2xl font-light text-white mb-6">Error Handling</h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-white/50 font-medium">Code</th>
                        <th className="text-left py-3 px-4 text-white/50 font-medium">Meaning</th>
                        <th className="text-left py-3 px-4 text-white/50 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr>
                        <td className="py-3 px-4 text-white font-mono">200</td>
                        <td className="py-3 px-4 text-white/70">OK</td>
                        <td className="py-3 px-4 text-white/70">Successful request</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-white font-mono">400</td>
                        <td className="py-3 px-4 text-white/70">Bad Request</td>
                        <td className="py-3 px-4 text-white/70">Invalid parameters</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-white font-mono">401</td>
                        <td className="py-3 px-4 text-white/70">Unauthorized</td>
                        <td className="py-3 px-4 text-white/70">Invalid API key</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-white font-mono">404</td>
                        <td className="py-3 px-4 text-white/70">Not Found</td>
                        <td className="py-3 px-4 text-white/70">No memes match criteria</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-white font-mono">429</td>
                        <td className="py-3 px-4 text-white/70">Too Many Requests</td>
                        <td className="py-3 px-4 text-white/70">Rate limit exceeded</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-white font-mono">500</td>
                        <td className="py-3 px-4 text-white/70">Server Error</td>
                        <td className="py-3 px-4 text-white/70">Internal server error</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 bg-black/30 rounded-lg p-4">
                  <p className="text-sm text-white/70 mb-2">Error response format:</p>
                  <pre className="text-sm text-white/80 font-mono">{`{
  "success": false,
  "error": "Description of what went wrong"
}`}</pre>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
