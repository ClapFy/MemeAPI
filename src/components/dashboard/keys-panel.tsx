'use client'

import { useState, useEffect } from 'react'
import { 
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Key,
  AlertCircle,
  Search
} from 'lucide-react'

interface ApiKey {
  id: string
  key: string
  name: string
  requestsUsed: number
  requestsLimit: number
  isUnlimited?: boolean
  isActive: boolean
  createdAt: string
  lastUsedAt?: string
  rateLimitTier: string
}

export default function KeysPanel() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [newKeyData, setNewKeyData] = useState({
    isUnlimited: false,
    name: '',
    requestsLimit: 1000,
    rateLimitTier: 'standard'
  })

  useEffect(() => {
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    try {
      const response = await fetch('/api/keys?includeInactive=true')
      if (response.ok) {
        const data = await response.json()
        setKeys(data.data)
      } else {
        setError('Failed to load keys')
      }
    } catch {
      setError('Failed to load keys')
    } finally {
      setLoading(false)
    }
  }

  const createKey = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKeyData)
      })
      
      if (response.ok) {
        setShowCreateModal(false)
        setNewKeyData({ name: '', requestsLimit: 1000, rateLimitTier: 'standard' })
        fetchKeys()
      } else {
        setError('Failed to create key')
      }
    } catch {
      setError('Failed to create key')
    }
  }

  const revokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this key?')) return
    
    try {
      const response = await fetch(`/api/keys?id=${id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchKeys()
      } else {
        setError('Failed to revoke key')
      }
    } catch {
      setError('Failed to revoke key')
    }
  }

  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return (
      <div className="glass p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-white/50">Loading keys...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="glass p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-white">API Keys</h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Key
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="space-y-3">
          {keys.length === 0 ? (
            <div className="text-center py-8 text-white/30">
              No API keys yet. Create one to get started.
            </div>
          ) : (
            keys.map((key) => (
              <div 
                key={key.id}
                className={`p-4 rounded-lg border transition-colors ${
                  key.isActive 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-white/5 border-white/5 opacity-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Key className="w-4 h-4 text-white/50" />
                      <span className="text-white font-medium">{key.name}</span>
                      {!key.isActive && (
                        <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
                          Revoked
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <code className="text-sm text-white/60 font-mono bg-black/30 px-2 py-1 rounded">
                        {key.key.slice(0, 12)}...{key.key.slice(-8)}
                      </code>
                      <button
                        onClick={() => copyKey(key.key, key.id)}
                        className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                      >
                        {copiedId === key.id ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-white/50">
                        Usage: <span className="text-white">{key.requestsUsed}</span>
                        {' / '}
                        <span className="text-white">{key.isUnlimited ? "Unlimited" : key.requestsLimit}</span>
                      </div>
                      <div className="text-white/50">
                        Tier: <span className="text-white capitalize">{key.rateLimitTier}</span>
                      </div>
                    </div>
                  </div>

                  {key.isActive && (
                    <button
                      onClick={() => revokeKey(key.id)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"
                      title="Revoke key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-white mb-4">Create New API Key</h3>
            
            <form onSubmit={createKey} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={newKeyData.name}
                  onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30"
                  placeholder="Production Key"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">
                  Request Limit
                </label>
                <input
                  type="number"
                  value={newKeyData.requestsLimit}
                  onChange={(e) => setNewKeyData({ ...newKeyData, requestsLimit: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30"
                  min="1"
                  max="1000000"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">
                  Rate Limit Tier
                </label>
                <select
                  value={newKeyData.rateLimitTier}
                  onChange={(e) => setNewKeyData({ ...newKeyData, rateLimitTier: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30"
                >
                  <option value="free">Free (10 req/min)</option>
                  <option value="standard">Standard (60 req/min)</option>
                  <option value="premium">Premium (300 req/min)</option>
                </select>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isUnlimited"
                  checked={newKeyData.isUnlimited}
                  onChange={(e) => setNewKeyData({ ...newKeyData, isUnlimited: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-white"
                />
                <label htmlFor="isUnlimited" className="text-sm text-white/70">
                  Unlimited requests
                </label>
              </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/15 transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
