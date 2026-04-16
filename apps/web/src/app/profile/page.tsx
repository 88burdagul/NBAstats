'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push('/login')
      else fetchUserStats()
    }
  }, [user, authLoading, router])

  const fetchUserStats = async () => {
    try {
      setLoading(true)
      const { count } = await supabase.from('favorite_players').select('*', { count: 'exact', head: true })
      setFavoriteCount(count || 0)
      setLoading(false)
    } catch { setLoading(false) }
  }

  const handleSignOut = async () => { await signOut(); router.push('/') }

  if (authLoading || loading || !user) {
    return (
      <main className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-surface-3 border-t-accent rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-surface-0">
      <nav className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-border">
        <button onClick={() => router.push('/')} className="text-accent text-xl font-extrabold tracking-tight">HOOPMARKET</button>
        <button onClick={() => router.back()} className="text-sm text-text-secondary hover:text-text-primary transition-colors">Back</button>
      </nav>

      <div className="max-w-[480px] mx-auto px-6 md:px-10 py-10 animate-fade-in">
        <div className="flex items-center gap-5 mb-10">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-title text-text-primary">{user.email?.split('@')[0]}</h1>
            <p className="text-sm text-text-tertiary">{user.email}</p>
          </div>
        </div>

        <div className="space-y-3 mb-10">
          <div className="flex justify-between py-3 border-b border-border/50">
            <span className="text-sm text-text-tertiary">Member since</span>
            <span className="text-sm text-text-primary">{new Date(user.created_at || '').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flex justify-between py-3 border-b border-border/50">
            <span className="text-sm text-text-tertiary">Watchlist</span>
            <span className="text-sm text-text-primary">{favoriteCount} players</span>
          </div>
          <div className="flex justify-between py-3 border-b border-border/50">
            <span className="text-sm text-text-tertiary">User ID</span>
            <span className="text-sm text-text-tertiary font-mono">{user.id.slice(0, 8)}...</span>
          </div>
        </div>

        <div className="space-y-3">
          <button onClick={() => router.push('/favorites')}
            className="w-full py-3 bg-surface-1 border border-border text-sm font-medium text-text-primary rounded-xl hover:border-accent transition-colors">
            View Watchlist
          </button>
          <button onClick={handleSignOut}
            className="w-full py-3 bg-surface-1 border border-border text-sm font-medium text-negative rounded-xl hover:border-negative/50 transition-colors">
            Sign out
          </button>
        </div>
      </div>
    </main>
  )
}
