'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface FavoritePlayer {
  id: number; player_id: string; player_name: string; team: string; created_at: string
}

export default function FavoritesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [favoritePlayers, setFavoritePlayers] = useState<FavoritePlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push('/login')
      else fetchFavorites()
    }
  }, [user, authLoading, router])

  const fetchFavorites = async () => {
    try {
      setLoading(true); setError('')
      const { data, error } = await supabase.from('favorite_players').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setFavoritePlayers(data || [])
      setLoading(false)
    } catch { setError('Failed to load watchlist'); setLoading(false) }
  }

  const removeFavorite = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    try {
      const { error } = await supabase.from('favorite_players').delete().eq('id', id)
      if (error) throw error
      setFavoritePlayers(favoritePlayers.filter(f => f.id !== id))
    } catch { alert('Failed to remove') }
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-surface-3 border-t-accent rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-surface-0">
      <nav className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-border">
        <div className="flex items-center gap-10">
          <button onClick={() => router.push('/')} className="text-accent text-xl font-extrabold tracking-tight">HOOPMARKET</button>
          <div className="hidden md:flex items-center gap-1">
            {[{ l: 'Players', h: '/' }, { l: 'Teams', h: '/teams' }, { l: 'Compare', h: '/compare' }, { l: 'Games', h: '/games' }, { l: 'Reports', h: '/reports' }].map(link => (
              <button key={link.h} onClick={() => router.push(link.h)}
                className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary rounded-lg transition-colors">
                {link.l}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-[800px] mx-auto px-6 md:px-10 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-headline text-text-primary">Watchlist</h1>
          <p className="text-sm text-text-secondary mt-1">{favoritePlayers.length} player{favoritePlayers.length !== 1 ? 's' : ''} saved</p>
        </div>

        {error && (
          <div className="bg-surface-1 border border-negative/20 rounded-2xl p-6 text-center mb-6">
            <p className="text-text-primary">{error}</p>
          </div>
        )}

        {favoritePlayers.length > 0 ? (
          <div className="animate-fade-up">
            {favoritePlayers.map((fav) => (
              <div key={fav.id} onClick={() => router.push(`/player/${fav.player_id}`)}
                className="hover-row flex items-center justify-between py-4 px-4 -mx-4 rounded-xl border-b border-border/50 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-surface-2 shrink-0">
                    <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${fav.player_id}.png`} alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{fav.player_name}</p>
                    <p className="text-xs text-text-tertiary">{fav.team} · Added {new Date(fav.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
                <button onClick={(e) => removeFavorite(e, fav.id)}
                  className="text-text-tertiary hover:text-negative text-sm transition-colors px-2">
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 animate-fade-in">
            <p className="text-text-secondary mb-2">Your watchlist is empty</p>
            <button onClick={() => router.push('/')} className="text-sm text-accent hover:underline">Browse players</button>
          </div>
        )}
      </div>
    </main>
  )
}
