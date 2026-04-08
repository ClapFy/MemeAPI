'use client'

import { useState, useEffect } from 'react'
import { Star, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react'

interface Payment {
  id: string
  telegramId: string
  user: {
    id: string
    username?: string
    name: string
  } | null
  stars: number
  requestsAdded: number
  status: string
  createdAt: string
}

interface StarStats {
  totalTransactions: number
  totalStars: number
  totalRequestsPurchased: number
  completedTransactions: number
  pendingTransactions: number
  failedTransactions: number
}

export default function PaymentsPanel() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<StarStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments')
      if (response.ok) {
        const data = await response.json()
        setPayments(data.data.transactions)
        setStats(data.data.stats)
      } else {
        setError('Failed to load payments')
      }
    } catch {
      setError('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="glass p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-white/50">Loading payments...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/50 text-sm">Total Stars</span>
              <Star className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-light text-white">{stats.totalStars.toLocaleString()}</div>
          </div>
          <div className="glass p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/50 text-sm">Requests Sold</span>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-light text-white">{stats.totalRequestsPurchased.toLocaleString()}</div>
          </div>
          <div className="glass p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/50 text-sm">Completed</span>
              <CheckCircle className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-light text-white">{stats.completedTransactions}</div>
          </div>
          <div className="glass p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/50 text-sm">Total</span>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-light text-white">{stats.totalTransactions}</div>
          </div>
        </div>
      )}

      <div className="glass p-6">
        <h3 className="text-lg font-medium text-white mb-4">Recent Transactions</h3>
        
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {payments.length === 0 ? (
            <div className="text-center py-8 text-white/30">
              No transactions yet
            </div>
          ) : (
            payments.map((payment) => (
              <div 
                key={payment.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${
                    payment.status === 'completed' ? 'bg-green-400' :
                    payment.status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'
                  }`} />
                  <div>
                    <div className="text-white text-sm">
                      {payment.user?.name || 'Unknown User'}
                    </div>
                    <div className="text-white/50 text-xs">
                      ID: {payment.telegramId.slice(0, 8)}...
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white text-sm">
                    {payment.stars} Stars
                  </div>
                  <div className="text-white/50 text-xs">
                    +{payment.requestsAdded.toLocaleString()} requests
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
