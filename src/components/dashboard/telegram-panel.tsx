'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Minus, User } from 'lucide-react'

interface TelegramUser {
  id: string
  telegramId: string
  username?: string
  name: string
  freeRequestsUsed: number
  freeRequestsLimit: number
  starsBalance: number
  totalPurchased: number
  apiKey?: {
    key: string
    requestsUsed: number
    requestsLimit: number
    isUnlimited: boolean
  }
}

export default function TelegramPanel() {
  const [users, setUsers] = useState<TelegramUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedUser, setSelectedUser] = useState<TelegramUser | null>(null)
  const [creditAmount, setCreditAmount] = useState(100)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/telegram')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.data)
      } else {
        setError('Failed to load users')
      }
    } catch {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const updateCredits = async (telegramId: string, amount: number) => {
    try {
      const response = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, requests: amount })
      })
      
      if (response.ok) {
        fetchUsers()
        setSelectedUser(null)
      } else {
        setError('Failed to update credits')
      }
    } catch {
      setError('Failed to update credits')
    }
  }

  if (loading) {
    return (
      <div className="glass p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-white/50">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="glass p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Telegram Users
          </h3>
          <div className="text-sm text-white/50">
            {users.length} total users
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {users.length === 0 ? (
            <div className="text-center py-8 text-white/30">
              No Telegram users yet
            </div>
          ) : (
            users.map((user) => (
              <div 
                key={user.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-white/50" />
                  </div>
                  <div>
                    <div className="text-white text-sm">{user.name}</div>
                    {user.username && (
                      <div className="text-white/50 text-xs">@{user.username}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-white text-sm">
                      {user.apiKey?.isUnlimited 
                        ? 'Unlimited' 
                        : (user.apiKey?.requestsLimit || 0) - (user.apiKey?.requestsUsed || 0)} remaining
                    </div>
                    <div className="text-white/50 text-xs">
                      {user.starsBalance} stars
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm hover:bg-white/15 transition-colors"
                  >
                    Manage
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-white mb-4">
              Manage User: {selectedUser.name}
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Current Requests:</span>
                <span className="text-white">
                  {selectedUser.apiKey?.isUnlimited 
                    ? 'Unlimited' 
                    : `${(selectedUser.apiKey?.requestsLimit || 0) - (selectedUser.apiKey?.requestsUsed || 0)} remaining`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Total Used:</span>
                <span className="text-white">{selectedUser.apiKey?.requestsUsed || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Stars Balance:</span>
                <span className="text-white">{selectedUser.starsBalance}</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs uppercase tracking-wider text-white/50">
                Credit Amount
              </label>
              <input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                min="1"
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => updateCredits(selectedUser.telegramId, creditAmount)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Credits
                </button>
                <button
                  onClick={() => updateCredits(selectedUser.telegramId, -creditAmount)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                  Remove Credits
                </button>
              </div>
            </div>

            <button
              onClick={() => setSelectedUser(null)}
              className="w-full mt-4 px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/5 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
