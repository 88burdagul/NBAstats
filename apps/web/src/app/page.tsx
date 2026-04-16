'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface NBAPlayer {
  id: string
  name: string
  team: string
  teamId: string
  position: string
  age: number
  gamesPlayed: number
  points: number
  rebounds: number
  assists: number
  imageUrl: string
  rating?: number
  ratingChange?: number
  percentChange?: number
}

type SortField = 'name' | 'rating' | 'percentChange' | 'points' | 'gamesPlayed'
type SortOrder = 'asc' | 'desc'

function Nav({ current, user, authLoading, onSignOut }: { current: string; user: any; authLoading: boolean; onSignOut: () => void }) {
  const router = useRouter()
  const links = [
    { label: 'Players', href: '/' },
    { label: 'Teams', href: '/teams' },
    { label: 'Compare', href: '/compare' },
    { label: 'Games', href: '/games' },
    { label: 'Reports', href: '/reports' },
  ]

  return (
    <nav className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-border">
      <div className="flex items-center gap-10">
        <button onClick={() => router.push('/')} className="flex items-center gap-2">
          <span className="text-accent text-xl font-extrabold tracking-tight">HOOPMARKET</span>
        </button>

        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                current === link.href
                  ? 'text-accent bg-accent-glow'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!authLoading && (
          user ? (
            <>
              <button
                onClick={() => router.push('/favorites')}
                className="text-sm font-medium text-text-secondary hover:text-accent transition-colors"
              >
                Watchlist
              </button>
              <button
                onClick={onSignOut}
                className="text-sm font-medium text-text-tertiary hover:text-text-primary transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push('/login')}
                className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Log in
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="px-4 py-2 text-sm font-semibold bg-accent text-white rounded-lg hover:bg-accent-dim transition-colors"
              >
                Sign up
              </button>
            </>
          )
        )}
      </div>
    </nav>
  )
}

export default function HomePage() {
  const router = useRouter()
  const { user, signOut, loading: authLoading } = useAuth()

  const [players, setPlayers] = useState<NBAPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const [selectedPosition, setSelectedPosition] = useState<string>('all')
  const [minGamesPlayed, setMinGamesPlayed] = useState<number>(0)

  const [sortField, setSortField] = useState<SortField>('rating')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [addingFavorite, setAddingFavorite] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const calculateRating = (player: any) => {
    const baseRating = 20
    const scoringBonus = player.points * 2.5
    const assistBonus = player.assists * 3
    const reboundBonus = player.rebounds * 1.5
    const experienceBonus = Math.min(player.gamesPlayed * 0.1, 8)

    const rating = baseRating + scoringBonus + assistBonus + reboundBonus + experienceBonus

    const seed = parseInt(player.id) || 1
    const seededRandom = Math.sin(seed * 12.9898) * 43758.5453
    const randomFactor = seededRandom - Math.floor(seededRandom)
    const ratingChange = (randomFactor * 20) - 8
    const percentChange = rating > 0 ? (ratingChange / rating) * 100 : 0

    return {
      ...player,
      rating: parseFloat(rating.toFixed(1)),
      ratingChange: parseFloat(ratingChange.toFixed(2)),
      percentChange: parseFloat(percentChange.toFixed(1)),
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.refresh()
  }

  useEffect(() => {
    if (user) {
      fetchFavorites()
    } else {
      setFavorites(new Set())
    }
  }, [user])

  const fetchFavorites = async () => {
    try {
      const { data } = await supabase.from('favorite_players').select('player_id')
      if (data) setFavorites(new Set(data.map(fav => fav.player_id)))
    } catch (err) {
      console.error('Error fetching favorites:', err)
    }
  }

  const toggleFavorite = async (e: React.MouseEvent, player: NBAPlayer) => {
    e.stopPropagation()
    if (!user) { router.push('/login'); return }
    setAddingFavorite(player.id)

    try {
      if (favorites.has(player.id)) {
        await supabase.from('favorite_players').delete().eq('player_id', player.id)
        const next = new Set(favorites)
        next.delete(player.id)
        setFavorites(next)
      } else {
        await supabase.from('favorite_players').insert({
          user_id: user.id, player_id: player.id,
          player_name: player.name, team: player.team,
        })
        setFavorites(new Set(favorites).add(player.id))
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
    } finally {
      setAddingFavorite(null)
    }
  }

  useEffect(() => { fetchPlayers() }, [])

  const fetchPlayers = async () => {
    try {
      setLoading(true)
      setError('')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/players/all`)
      const data = await response.json()

      if (data.success && data.data && data.indices) {
        const { indices } = data
        const transformedPlayers = data.data
          .map((player: any[]) => ({
            id: player[indices.playerId],
            name: player[indices.playerName],
            team: player[indices.teamAbbrev] || 'N/A',
            teamId: player[indices.teamId],
            position: player[indices.position] || 'N/A',
            age: player[indices.age] || 0,
            gamesPlayed: player[indices.gamesPlayed] || 0,
            points: player[indices.points] || 0,
            rebounds: player[indices.rebounds] || 0,
            assists: player[indices.assists] || 0,
            imageUrl: `https://cdn.nba.com/headshots/nba/latest/1040x760/${player[indices.playerId]}.png`,
          }))
          .filter((p: NBAPlayer) => p.gamesPlayed > 0)
          .map(calculateRating)

        setPlayers(transformedPlayers)
      }
      setLoading(false)
    } catch (err) {
      console.error('Error fetching players:', err)
      setError('Unable to load player data. Make sure the API server is running.')
      setLoading(false)
    }
  }

  const uniqueTeams = Array.from(new Set(players.map(p => p.team))).sort()
  const uniquePositions = Array.from(new Set(players.map(p => p.position))).sort()

  const filteredAndSortedPlayers = players
    .filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesTeam = selectedTeam === 'all' || player.team === selectedTeam
      const matchesPosition = selectedPosition === 'all' || player.position === selectedPosition
      const matchesGames = player.gamesPlayed >= minGamesPlayed
      return matchesSearch && matchesTeam && matchesPosition && matchesGames
    })
    .sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'name': cmp = a.name.localeCompare(b.name); break
        case 'rating': cmp = (a.rating || 0) - (b.rating || 0); break
        case 'percentChange': cmp = (a.percentChange || 0) - (b.percentChange || 0); break
        case 'points': cmp = a.points - b.points; break
        case 'gamesPlayed': cmp = a.gamesPlayed - b.gamesPlayed; break
      }
      return sortOrder === 'asc' ? cmp : -cmp
    })

  const trendingUp = [...players].sort((a, b) => (b.percentChange || 0) - (a.percentChange || 0)).slice(0, 5)
  const trendingDown = [...players].sort((a, b) => (a.percentChange || 0) - (b.percentChange || 0)).slice(0, 5)

  const leaguePulse = players.length > 0
    ? players.slice(0, 100).reduce((sum, p) => sum + (p.rating || 0), 0) / Math.min(players.length, 100)
    : 0
  const avgChange = players.length > 0
    ? players.reduce((sum, p) => sum + (p.percentChange || 0), 0) / players.length
    : 0

  return (
    <main className="min-h-screen bg-surface-0">
      <Nav current="/" user={user} authLoading={authLoading} onSignOut={handleSignOut} />

      {/* Ticker */}
      {!loading && players.length > 0 && (
        <div className="ticker-wrap">
          <div className="ticker-content text-label text-text-tertiary">
            {[...trendingUp, ...trendingDown, ...trendingUp].map((player, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="text-text-secondary font-semibold">{player.name.split(' ').pop()}</span>
                <span className="stat-num">{player.rating?.toFixed(1)}</span>
                <span className={`stat-num ${(player.percentChange || 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {(player.percentChange || 0) >= 0 ? '+' : ''}{player.percentChange?.toFixed(1)}%
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-8">

        {/* Hero */}
        {!loading && !error && (
          <div className="mb-10 animate-fade-in">
            <h1 className="text-display text-text-primary mb-2">
              Every player.<br />
              <span className="text-accent-gradient">Rated.</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-md">
              Real-time ratings built from live NBA performance data.
            </p>
          </div>
        )}

        {/* Pulse Stats */}
        {!loading && !error && (
          <div className="grid grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden mb-10 animate-fade-up">
            <div className="bg-surface-1 p-6">
              <p className="text-label text-text-tertiary uppercase mb-2">League Pulse</p>
              <p className="stat-num text-stat text-text-primary">{leaguePulse.toFixed(1)}</p>
            </div>
            <div className="bg-surface-1 p-6">
              <p className="text-label text-text-tertiary uppercase mb-2">Active Players</p>
              <p className="stat-num text-stat text-text-primary">{players.length}</p>
            </div>
            <div className="bg-surface-1 p-6">
              <p className="text-label text-text-tertiary uppercase mb-2">Avg Trend</p>
              <p className={`stat-num text-stat ${avgChange >= 0 ? 'text-positive' : 'text-negative'}`}>
                {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        {/* Trending */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="animate-fade-up stagger-1" style={{ opacity: 0 }}>
              <h2 className="text-label text-positive uppercase mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-positive" /> Trending Up
              </h2>
              <div className="flex flex-col">
                {trendingUp.map((player, i) => (
                  <button
                    key={player.id}
                    onClick={() => router.push(`/player/${player.id}`)}
                    className="hover-row flex items-center justify-between py-3 px-3 -mx-3 rounded-lg cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-text-tertiary text-sm font-mono w-4">{i + 1}</span>
                      <img src={player.imageUrl} alt="" className="w-9 h-9 rounded-full object-cover bg-surface-2"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-text-primary">{player.name}</p>
                        <p className="text-xs text-text-tertiary">{player.team} · {player.position}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="stat-num text-sm font-bold text-text-primary">{player.rating?.toFixed(1)}</p>
                      <p className="stat-num text-xs text-positive">+{player.percentChange?.toFixed(1)}%</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="animate-fade-up stagger-2" style={{ opacity: 0 }}>
              <h2 className="text-label text-negative uppercase mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-negative" /> Trending Down
              </h2>
              <div className="flex flex-col">
                {trendingDown.map((player, i) => (
                  <button
                    key={player.id}
                    onClick={() => router.push(`/player/${player.id}`)}
                    className="hover-row flex items-center justify-between py-3 px-3 -mx-3 rounded-lg cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-text-tertiary text-sm font-mono w-4">{i + 1}</span>
                      <img src={player.imageUrl} alt="" className="w-9 h-9 rounded-full object-cover bg-surface-2"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-text-primary">{player.name}</p>
                        <p className="text-xs text-text-tertiary">{player.team} · {player.position}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="stat-num text-sm font-bold text-text-primary">{player.rating?.toFixed(1)}</p>
                      <p className="stat-num text-xs text-negative">{player.percentChange?.toFixed(1)}%</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        {!loading && !error && <div className="divider mb-8" />}

        {/* Search + Filters */}
        {!loading && !error && (
          <div className="mb-6 animate-fade-up stagger-3" style={{ opacity: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 relative">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-surface-1 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary"
                  placeholder="Search players..."
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 text-sm font-medium rounded-xl border transition-colors ${
                  showFilters ? 'border-accent text-accent bg-accent-glow' : 'border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                Filters
              </button>
              <div className="flex items-center gap-2">
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="bg-surface-1 border border-border rounded-xl px-3 py-3 text-sm text-text-primary"
                >
                  <option value="rating">Rating</option>
                  <option value="percentChange">Trend</option>
                  <option value="points">Points</option>
                  <option value="gamesPlayed">Games</option>
                  <option value="name">Name</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-11 h-11 flex items-center justify-center bg-surface-1 border border-border rounded-xl text-text-secondary hover:text-accent transition-colors text-sm"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-3 gap-3 animate-fade-up">
                <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}
                  className="bg-surface-1 border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary">
                  <option value="all">All Teams</option>
                  {uniqueTeams.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={selectedPosition} onChange={(e) => setSelectedPosition(e.target.value)}
                  className="bg-surface-1 border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary">
                  <option value="all">All Positions</option>
                  {uniquePositions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={minGamesPlayed} onChange={(e) => setMinGamesPlayed(Number(e.target.value))}
                  className="bg-surface-1 border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary">
                  <option value="0">Min Games: Any</option>
                  <option value="10">10+ Games</option>
                  <option value="20">20+ Games</option>
                  <option value="40">40+ Games</option>
                </select>
              </div>
            )}

            <p className="text-xs text-text-tertiary mt-3">
              {filteredAndSortedPlayers.length} of {players.length} players
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
            <div className="w-10 h-10 border-2 border-surface-3 border-t-accent rounded-full animate-spin mb-6" />
            <p className="text-sm text-text-secondary">Loading player data</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-surface-1 border border-negative/20 rounded-2xl p-8 text-center animate-fade-in">
            <p className="text-text-primary font-semibold mb-2">{error}</p>
            <button onClick={fetchPlayers}
              className="mt-4 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent-dim transition-colors">
              Retry
            </button>
          </div>
        )}

        {/* Player List */}
        {!loading && !error && (
          <div className="animate-fade-up stagger-4" style={{ opacity: 0 }}>
            {/* Header row */}
            <div className="hidden md:grid grid-cols-[1fr_80px_80px_80px_80px_80px_40px] gap-4 px-4 py-2 text-label text-text-tertiary uppercase border-b border-border">
              <span>Player</span>
              <span className="text-right">Rating</span>
              <span className="text-right">Trend</span>
              <span className="text-right">PPG</span>
              <span className="text-right">RPG</span>
              <span className="text-right">APG</span>
              <span />
            </div>

            <div className="max-h-[700px] overflow-y-auto scrollbar-hide">
              {filteredAndSortedPlayers.slice(0, 100).map((player, i) => (
                <div
                  key={player.id}
                  onClick={() => router.push(`/player/${player.id}`)}
                  className="hover-row grid grid-cols-[1fr_auto] md:grid-cols-[1fr_80px_80px_80px_80px_80px_40px] gap-4 items-center px-4 py-3.5 border-b border-border/50 cursor-pointer group"
                >
                  {/* Player info */}
                  <div className="flex items-center gap-4">
                    <span className="text-text-tertiary text-xs font-mono w-6 text-right shrink-0">{i + 1}</span>
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-2 shrink-0">
                      <img src={player.imageUrl} alt="" className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
                        {player.name}
                      </p>
                      <p className="text-xs text-text-tertiary">{player.team} · {player.position} · {player.gamesPlayed}G</p>
                    </div>
                  </div>

                  {/* Mobile: compact stats */}
                  <div className="flex md:hidden items-center gap-3">
                    <span className="stat-num text-sm font-bold text-text-primary">{player.rating?.toFixed(1)}</span>
                    <span className={`stat-num text-xs font-semibold ${(player.percentChange || 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {(player.percentChange || 0) >= 0 ? '+' : ''}{player.percentChange?.toFixed(1)}%
                    </span>
                  </div>

                  {/* Desktop columns */}
                  <span className="hidden md:block stat-num text-sm font-bold text-text-primary text-right">{player.rating?.toFixed(1)}</span>
                  <span className={`hidden md:block stat-num text-sm text-right font-semibold ${(player.percentChange || 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {(player.percentChange || 0) >= 0 ? '+' : ''}{player.percentChange?.toFixed(1)}%
                  </span>
                  <span className="hidden md:block stat-num text-sm text-text-secondary text-right">{player.points.toFixed(1)}</span>
                  <span className="hidden md:block stat-num text-sm text-text-secondary text-right">{player.rebounds.toFixed(1)}</span>
                  <span className="hidden md:block stat-num text-sm text-text-secondary text-right">{player.assists.toFixed(1)}</span>

                  {/* Watchlist */}
                  <button
                    onClick={(e) => toggleFavorite(e, player)}
                    disabled={addingFavorite === player.id}
                    className={`hidden md:flex w-8 h-8 items-center justify-center rounded-lg transition-colors text-sm ${
                      favorites.has(player.id)
                        ? 'text-accent'
                        : 'text-text-tertiary hover:text-accent'
                    }`}
                  >
                    {favorites.has(player.id) ? '★' : '☆'}
                  </button>
                </div>
              ))}
            </div>

            {filteredAndSortedPlayers.length === 0 && (
              <div className="text-center py-20">
                <p className="text-text-secondary mb-2">No players match your filters</p>
                <button
                  onClick={() => { setSearchTerm(''); setSelectedTeam('all'); setSelectedPosition('all'); setMinGamesPlayed(0) }}
                  className="text-sm text-accent hover:underline">
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
