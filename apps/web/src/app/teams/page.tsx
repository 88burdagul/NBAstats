'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

const NBA_TEAMS_MAP: Record<string, { abbr: string }> = {
  '1610612737': { abbr: 'ATL' }, '1610612738': { abbr: 'BOS' }, '1610612751': { abbr: 'BKN' },
  '1610612766': { abbr: 'CHA' }, '1610612741': { abbr: 'CHI' }, '1610612739': { abbr: 'CLE' },
  '1610612742': { abbr: 'DAL' }, '1610612743': { abbr: 'DEN' }, '1610612765': { abbr: 'DET' },
  '1610612744': { abbr: 'GSW' }, '1610612745': { abbr: 'HOU' }, '1610612754': { abbr: 'IND' },
  '1610612746': { abbr: 'LAC' }, '1610612747': { abbr: 'LAL' }, '1610612763': { abbr: 'MEM' },
  '1610612748': { abbr: 'MIA' }, '1610612749': { abbr: 'MIL' }, '1610612750': { abbr: 'MIN' },
  '1610612740': { abbr: 'NOP' }, '1610612752': { abbr: 'NYK' }, '1610612760': { abbr: 'OKC' },
  '1610612753': { abbr: 'ORL' }, '1610612755': { abbr: 'PHI' }, '1610612756': { abbr: 'PHX' },
  '1610612757': { abbr: 'POR' }, '1610612758': { abbr: 'SAC' }, '1610612759': { abbr: 'SAS' },
  '1610612761': { abbr: 'TOR' }, '1610612762': { abbr: 'UTA' }, '1610612764': { abbr: 'WAS' },
}

interface TeamWithStats {
  id: string; name: string; abbr: string; wins: number; losses: number
  ppg: number; rpg: number; apg: number; conference: string; conferenceRank: number; logoUrl: string
}

interface Player {
  id: string; name: string; number: string; position: string; height: string; weight: string; age: number
}

export default function TeamsPage() {
  const router = useRouter()
  const [teams, setTeams] = useState<TeamWithStats[]>([])
  const [selectedTeam, setSelectedTeam] = useState<TeamWithStats | null>(null)
  const [roster, setRoster] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [error, setError] = useState('')
  const [conferenceFilter, setConferenceFilter] = useState<'all' | 'East' | 'West'>('all')

  useEffect(() => { fetchTeams() }, [])

  const fetchTeams = async () => {
    try {
      setLoadingTeams(true)
      setError('')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/teams/stats`)
      const data = await response.json()
      if (data.success && data.data) {
        const enriched: TeamWithStats[] = data.data.map((team: any) => {
          const info = NBA_TEAMS_MAP[team.id] || { abbr: 'NBA' }
          return { ...team, abbr: info.abbr, logoUrl: `https://cdn.nba.com/logos/nba/${team.id}/primary/L/logo.svg` }
        })
        setTeams(enriched)
      } else {
        setError(data.error || 'Failed to load teams')
      }
      setLoadingTeams(false)
    } catch (err) {
      setError('Failed to fetch teams from API')
      setLoadingTeams(false)
    }
  }

  const fetchRoster = async (teamId: string) => {
    try {
      setLoading(true)
      setError('')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/team/${teamId}/roster`)
      const data = await response.json()
      if (data.success && data.data) {
        const headers = data.data.headers
        const parsedRoster: Player[] = data.data.rowSet.map((player: any[]) => ({
          id: player[headers.indexOf('PLAYER_ID')]?.toString() || '',
          name: player[headers.indexOf('PLAYER')] || 'Unknown',
          number: player[headers.indexOf('NUM')] || '-',
          position: player[headers.indexOf('POSITION')] || '-',
          height: player[headers.indexOf('HEIGHT')] || '-',
          weight: player[headers.indexOf('WEIGHT')] || '-',
          age: player[headers.indexOf('AGE')] || 0,
        }))
        setRoster(parsedRoster.sort((a, b) => a.name.localeCompare(b.name)))
      }
      setLoading(false)
    } catch (err) {
      setError('Failed to load roster')
      setLoading(false)
    }
  }

  const handleTeamClick = (team: TeamWithStats) => {
    setSelectedTeam(team)
    fetchRoster(team.id)
  }

  const filteredTeams = teams.filter(t => conferenceFilter === 'all' || t.conference === conferenceFilter)

  return (
    <main className="min-h-screen bg-surface-0">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-border">
        <div className="flex items-center gap-10">
          <button onClick={() => router.push('/')} className="text-accent text-xl font-extrabold tracking-tight">HOOPMARKET</button>
          <div className="hidden md:flex items-center gap-1">
            {[{ l: 'Players', h: '/' }, { l: 'Teams', h: '/teams' }, { l: 'Compare', h: '/compare' }, { l: 'Games', h: '/games' }, { l: 'Reports', h: '/reports' }].map(link => (
              <button key={link.h} onClick={() => router.push(link.h)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${link.h === '/teams' ? 'text-accent bg-accent-glow' : 'text-text-secondary hover:text-text-primary'}`}>
                {link.l}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-headline text-text-primary">Teams</h1>
            <p className="text-sm text-text-secondary mt-1">30 franchises · standings & rosters</p>
          </div>
          <div className="flex gap-1.5">
            {(['all', 'East', 'West'] as const).map(conf => (
              <button key={conf} onClick={() => setConferenceFilter(conf)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  conferenceFilter === conf ? 'bg-accent text-white' : 'bg-surface-1 border border-border text-text-secondary hover:text-text-primary'
                }`}>
                {conf === 'all' ? 'All' : conf === 'East' ? 'Eastern' : 'Western'}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loadingTeams && (
          <div className="flex items-center justify-center py-32 animate-fade-in">
            <div className="w-10 h-10 border-2 border-surface-3 border-t-accent rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && !loadingTeams && (
          <div className="bg-surface-1 border border-negative/20 rounded-2xl p-8 text-center animate-fade-in">
            <p className="text-text-primary font-semibold mb-2">{error}</p>
            <button onClick={fetchTeams}
              className="mt-3 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent-dim transition-colors">
              Retry
            </button>
          </div>
        )}

        {/* Teams List */}
        {!loadingTeams && !error && (
          <div className="animate-fade-up">
            <div className="hidden md:grid grid-cols-[1fr_60px_80px_60px_60px_60px] gap-4 px-4 py-2 text-label text-text-tertiary uppercase border-b border-border">
              <span>Team</span>
              <span className="text-right">Rank</span>
              <span className="text-right">Record</span>
              <span className="text-right">PPG</span>
              <span className="text-right">RPG</span>
              <span className="text-right">APG</span>
            </div>

            {filteredTeams.map((team) => {
              const winPct = ((team.wins / (team.wins + team.losses)) * 100).toFixed(1)
              const isSelected = selectedTeam?.id === team.id
              return (
                <button key={team.id} onClick={() => handleTeamClick(team)}
                  className={`w-full hover-row grid grid-cols-[1fr_auto] md:grid-cols-[1fr_60px_80px_60px_60px_60px] gap-4 items-center px-4 py-4 border-b transition-colors text-left ${
                    isSelected ? 'border-accent/30 bg-accent-glow' : 'border-border/50'
                  }`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-lg p-1.5 flex items-center justify-center shrink-0">
                      <img src={team.logoUrl} alt={team.name} className="w-full h-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate transition-colors ${isSelected ? 'text-accent' : 'text-text-primary'}`}>
                        {team.name}
                      </p>
                      <p className="text-xs text-text-tertiary">{team.abbr} · {team.conference}</p>
                    </div>
                  </div>

                  <div className="flex md:hidden items-center gap-3 text-sm">
                    <span className="stat-num font-bold text-text-secondary">#{team.conferenceRank}</span>
                    <span className="stat-num text-text-secondary">{team.wins}-{team.losses}</span>
                  </div>

                  <span className="hidden md:block stat-num text-sm font-semibold text-text-primary text-right">#{team.conferenceRank}</span>
                  <div className="hidden md:block text-right">
                    <span className="stat-num text-sm text-text-primary">{team.wins}-{team.losses}</span>
                    <p className={`stat-num text-xs ${parseFloat(winPct) >= 50 ? 'text-positive' : 'text-negative'}`}>{winPct}%</p>
                  </div>
                  <span className="hidden md:block stat-num text-sm text-text-secondary text-right">{team.ppg.toFixed(1)}</span>
                  <span className="hidden md:block stat-num text-sm text-text-secondary text-right">{team.rpg.toFixed(1)}</span>
                  <span className="hidden md:block stat-num text-sm text-text-secondary text-right">{team.apg.toFixed(1)}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Roster Panel */}
        {selectedTeam && (
          <div className="mt-8 bg-surface-1 border border-border rounded-2xl overflow-hidden animate-fade-up">
            <div className="flex items-center gap-4 px-6 py-5 border-b border-border">
              <div className="w-12 h-12 bg-white rounded-xl p-2 flex items-center justify-center">
                <img src={selectedTeam.logoUrl} alt={selectedTeam.name} className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-title text-text-primary">{selectedTeam.name} Roster</h2>
                <p className="text-xs text-text-tertiary">{selectedTeam.wins}-{selectedTeam.losses} · {selectedTeam.conference}ern Conference</p>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-surface-3 border-t-accent rounded-full animate-spin" />
                </div>
              ) : roster.length === 0 ? (
                <p className="text-center py-12 text-text-tertiary">No roster data available</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {roster.map((player) => (
                    <button key={player.id} onClick={() => router.push(`/player/${player.id}`)}
                      className="hover-row flex items-center justify-between p-4 rounded-xl border border-border/50 text-left transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{player.name}</p>
                        <p className="text-xs text-text-tertiary">{player.position} · {player.height} · {player.age} yrs</p>
                      </div>
                      {player.number !== '-' && (
                        <span className="stat-num text-sm text-text-tertiary font-medium">#{player.number}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
