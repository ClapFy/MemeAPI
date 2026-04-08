'use client'

import { useState, useEffect } from 'react'
import { 
  Key, 
  BarChart3, 
  Activity, 
  LogOut, 
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react'
import StatsPanel from './stats-panel'
import KeysPanel from './keys-panel'

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<'overview' | 'keys'>('overview')
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/admin/login', { method: 'DELETE' })
      window.location.href = '/dashboard/login'
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen relative">
      <div className="environment" />
      
      <nav className="glass fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 flex items-center gap-8">
        <div className="flex items-center gap-2 text-white font-medium">
          <Activity className="w-5 h-5" />
          MemeAPI
        </div>
        <div className="text-sm text-white/50">Dashboard</div>
        <div className="text-xs text-white/30 font-mono">v1.0.0</div>
      </nav>

      <main className="relative z-10 pt-24 pb-8 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="glass p-6 h-fit animate-float">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'overview' 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                Overview
              </button>
              
              <button
                onClick={() => setActiveTab('keys')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'keys' 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Key className="w-5 h-5" />
                API Keys
              </button>
            </nav>

            <div className="mt-8 pt-6 border-t border-white/10">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:bg-white/5 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </aside>

          <div className="lg:col-span-3">
            {activeTab === 'overview' ? <StatsPanel /> : <KeysPanel />}
          </div>
        </div>
      </main>
    </div>
  )
}
