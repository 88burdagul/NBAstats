'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Game {
  gameId: string; gameDate: string
  homeTeam: { id: string; name: string; abbr: string; score: number }
  awayTeam: { id: string; name: string; abbr: string; score: number }
  gameStatus: string; period: number; time: string
}

export default function GamesPage() {
  const router = useRouter()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchGames()
    const interval = setInterval(fetchGames, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchGames = async () => {
    try {
      setError('')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/games/today`)
      const data = await response.json()
      if (data.success && data.data) {
        const { gameHeader, lineScore } = data.data
        if (!gameHeader || !lineScore) { setGames([]); setLoading(false); return }
        const parsed: Game[] = gameHeader.rowSet.map((game: any[]) => {
          const h = gameHeader.headers
          const gameId = game[h.indexOf('GAME_ID')]
          const homeLS = lineScore.rowSet.find((ls: any[]) => ls[lineScore.headers.indexOf('GAME_ID')] === gameId && ls[lineScore.headers.indexOf('TEAM_ID')] === game[h.indexOf('HOME_TEAM_ID')])
          const awayLS = lineScore.rowSet.find((ls: any[]) => ls[lineScore.headers.indexOf('GAME_ID')] === gameId && ls[lineScore.headers.indexOf('TEAM_ID')] !== game[h.indexOf('HOME_TEAM_ID')])
          return {
            gameId, gameDate: game[h.indexOf('GAME_DATE_EST')],
            homeTeam: { id: game[h.indexOf('HOME_TEAM_ID')], name: game[h.indexOf('HOME_TEAM_NAME')] || 'Home', abbr: homeLS?.[lineScore.headers.indexOf('TEAM_ABBREVIATION')] || 'HOME', score: homeLS?.[lineScore.headers.indexOf('PTS')] || 0 },
            awayTeam: { id: game[h.indexOf('VISITOR_TEAM_ID')], name: game[h.indexOf('VISITOR_TEAM_NAME')] || 'Away', abbr: awayLS?.[lineScore.headers.indexOf('TEAM_ABBREVIATION')] || 'AWAY', score: awayLS?.[lineScore.headers.indexOf('PTS')] || 0 },
            gameStatus: game[h.indexOf('GAME_STATUS_TEXT')] || '', period: game[h.indexOf('PERIOD')] || 0, time: game[h.indexOf('LIVE_PC_TIME')] || '',
          }
        })
        setGames(parsed)
      }
      setLoading(false)
    } catch { setError('Failed to load games'); setLoading(false) }
  }

  const getStatusInfo = (game: Game) => {
    if (game.gameStatus.includes('Final')) return { label: 'Final', color: 'text-text-secondary' }
    if (game.gameStatus === 'TBD' || game.period === 0) return { label: 'Upcoming', color: 'text-text-tertiary' }
    return { label: 'Live', color: 'text-positive', live: true }
  }

  return (
    <main className="min-h-screen bg-surface-0">
      <nav className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-border">
        <div className="flex items-center gap-10">
          <button onClick={() => router.push('/')} className="text-accent text-xl font-extrabold tracking-tight">HOOPMARKET</button>
          <div className="hidden md:flex items-center gap-1">
            {[{ l: 'Players', h: '/' }, { l: 'Teams', h: '/teams' }, { l: 'Compare', h: '/compare' }, { l: 'Games', h: '/games' }, { l: 'Reports', h: '/reports' }].map(link => (
              <button key={link.h} onClick={() => router.push(link.h)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${link.h === '/games' ? 'text-accent bg-accent-glow' : 'text-text-secondary hover:text-text-primary'}`}>
                {link.l}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-[800px] mx-auto px-6 md:px-10 py-8">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-headline text-text-primary">Games</h1>
            <p className="text-sm text-text-secondary mt-1">Today's scores · auto-refreshes</p>
          </div>
          {games.some(g => getStatusInfo(g).live) && (
            <div className="flex items-center gap-2">
              <span className="live-dot" />
              <span className="text-label text-positive uppercase">Live</span>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-32 animate-fade-in">
            <div className="w-10 h-10 border-2 border-surface-3 border-t-accent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-surface-1 border border-negative/20 rounded-2xl p-8 text-center animate-fade-in">
            <p className="text-text-primary font-semibold">{error}</p>
          </div>
        )}

        {!loading && games.length === 0 && !error && (
          <div className="text-center py-20 animate-fade-in">
            <p className="text-text-secondary mb-1">No games today</p>
            <p className="text-text-tertiary text-sm">Check back on game days</p>
          </div>
        )}

        {!loading && games.length > 0 && (
          <div className="space-y-3 animate-fade-up">
            {games.map((game) => {
              const status = getStatusInfo(game)
              const awayWinning = game.awayTeam.score > game.homeTeam.score
              const homeWinning = game.homeTeam.score > game.awayTeam.score
              return (
                <div key={game.gameId} className="bg-surface-1 border border-border rounded-2xl p-5 hover-lift">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {status.live && <span className="live-dot" />}
                      <span className={`text-label uppercase ${status.color}`}>{status.label}</span>
                    </div>
                    <span className="text-xs text-text-tertiary">{game.time || game.gameStatus}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-text-secondary w-10">{game.awayTeam.abbr}</span>
                        <span className="text-sm text-text-tertiary">{game.awayTeam.name}</span>
                      </div>
                      <span className={`stat-num text-xl font-bold ${awayWinning ? 'text-text-primary' : 'text-text-tertiary'}`}>
                        {game.awayTeam.score}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-text-secondary w-10">{game.homeTeam.abbr}</span>
                        <span className="text-sm text-text-tertiary">{game.homeTeam.name}</span>
                      </div>
                      <span className={`stat-num text-xl font-bold ${homeWinning ? 'text-text-primary' : 'text-text-tertiary'}`}>
                        {game.homeTeam.score}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
