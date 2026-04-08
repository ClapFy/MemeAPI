'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Clock, 
  Activity, 
  AlertCircle,
  Zap
} from 'lucide-react'

interface Stats {
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

export default function StatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      } else {
        setError('Failed to load stats')
      }
    } catch {
      setError('Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="glass p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-white/50">Loading statistics...</div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="glass p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-red-400 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error || 'Failed to load'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests"
          value={stats.totalRequests.toLocaleString()}
          icon={<Activity className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Today"
          value={stats.requestsToday.toLocaleString()}
          icon={<Clock className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="This Week"
          value={stats.requestsThisWeek.toLocaleString()}
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="Active Keys"
          value={stats.activeApiKeys.toString()}
          icon={<Zap className="w-5 h-5" />}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6">
          <h3 className="text-sm uppercase tracking-wider text-white/50 mb-4">
            Top Queries
          </h3>
          {stats.topQueries.length > 0 ? (
            <div className="space-y-2">
              {stats.topQueries.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5"
                >
                  <span className="text-white/80 text-sm truncate max-w-[200px]">
                    {item.query}
                  </span>
                  <span className="text-white/50 text-sm font-mono">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-white/30 text-sm">No queries yet</div>
          )}
        </div>

        <div className="glass p-6">
          <h3 className="text-sm uppercase tracking-wider text-white/50 mb-4">
            Top Subreddits
          </h3>
          {stats.topSubreddits.length > 0 ? (
            <div className="space-y-2">
              {stats.topSubreddits.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5"
                >
                  <span className="text-white/80 text-sm">
                    r/{item.subreddit}
                  </span>
                  <span className="text-white/50 text-sm font-mono">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-white/30 text-sm">No data yet</div>
          )}
        </div>
      </div>

      <div className="glass p-6">
        <h3 className="text-sm uppercase tracking-wider text-white/50 mb-4">
          Performance
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-3xl font-light text-white mb-1">
              {stats.averageResponseTime}ms
            </div>
            <div className="text-sm text-white/50">Average Response Time</div>
          </div>
          <div>
            <div className="text-3xl font-light text-white mb-1">
              {stats.errorRate}%
            </div>
            <div className="text-sm text-white/50">Error Rate</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon,
  color 
}: { 
  title: string
  value: string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    purple: 'bg-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/20 text-orange-400'
  }

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/50 text-sm">{title}</span>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-light text-white">{value}</div>
    </div>
  )
}
