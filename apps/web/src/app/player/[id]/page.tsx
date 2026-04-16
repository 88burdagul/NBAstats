'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export const dynamic = 'force-dynamic'

interface PlayerInfo {
  headers: string[]
  rowSet: any[][]
}

interface ValuationData {
  playerId: string
  season: string
  playerAge: number
  currentSeasonImpactScore: number
  weightedImpactScore: number
  ageFactor: number
  adjustedImpactScore: number
  fairAAV: number
  actualAAV: number | null
  surplusValue: number | null
  stockIndex: number
  trajectory: 'rising' | 'stable' | 'declining' | 'unknown'
  explanationBreakdown: {
    impactScoreWeights: Record<string, number>
    currentSeasonBreakdown: {
      pointsPer36: number
      assistsPer36: number
      reboundsPer36: number
      stealsPer36: number
      blocksPer36: number
      trueShootingPct: number
      turnoversPer36: number
      rawImpactScore: number
    } | null
    recencyWeights: { weight: number; season: string; impactScore: number }[]
    agingAdjustment: { age: number; peakAgeRange: string; adjustmentPercent: number }
    fairAAVCalibration: { method: string; medianSalary: number; topSalary: number; impactScoreToAAVSlope: number }
    stockIndexCalculation: { surplusValue: number | null; percentileRank: number; trajectoryBonus: number }
  }
}

const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

const getTrajectoryInfo = (trajectory: string) => {
  switch (trajectory) {
    case 'rising': return { label: 'Rising', color: 'text-positive' }
    case 'declining': return { label: 'Declining', color: 'text-negative' }
    case 'stable': return { label: 'Stable', color: 'text-text-secondary' }
    default: return { label: 'Unknown', color: 'text-text-tertiary' }
  }
}

const getIndexColor = (index: number): string => {
  if (index >= 70) return 'text-positive'
  if (index >= 40) return 'text-accent'
  return 'text-negative'
}

const getIndexLabel = (index: number): string => {
  if (index >= 80) return 'Elite'
  if (index >= 60) return 'Great'
  if (index >= 40) return 'Fair'
  if (index >= 20) return 'Below Avg'
  return 'Poor'
}

export default function PlayerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const playerId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [playerData, setPlayerData] = useState<any>(null)
  const [valuationData, setValuationData] = useState<ValuationData | null>(null)
  const [valuationLoading, setValuationLoading] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  useEffect(() => {
    if (playerId) {
      fetchPlayerData()
      fetchValuationData()
    }
  }, [playerId])

  const fetchValuationData = async () => {
    try {
      setValuationLoading(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/player/${playerId}/valuation`)
      const data = await response.json()
      if (data.success && data.valuation) setValuationData(data.valuation)
    } catch (err) {
      console.error('Error fetching valuation data:', err)
    } finally {
      setValuationLoading(false)
    }
  }

  const fetchPlayerData = async () => {
    try {
      setLoading(true)
      setError('')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/player/${playerId}/detail`)
      const data = await response.json()
      if (data.success) setPlayerData(data.data)
      else setError('Failed to load player data')
      setLoading(false)
    } catch (err) {
      console.error('Error fetching player data:', err)
      setError('Failed to connect to API.')
      setLoading(false)
    }
  }

  const getPlayerInfo = () => {
    if (!playerData?.playerInfo?.[0]) return null
    const info = playerData.playerInfo[0]
    const headers = info.headers
    const data = info.rowSet[0]
    return {
      name: data[headers.indexOf('DISPLAY_FIRST_LAST')],
      firstName: data[headers.indexOf('FIRST_NAME')],
      lastName: data[headers.indexOf('LAST_NAME')],
      jersey: data[headers.indexOf('JERSEY')],
      position: data[headers.indexOf('POSITION')],
      height: data[headers.indexOf('HEIGHT')],
      weight: data[headers.indexOf('WEIGHT')],
      birthDate: data[headers.indexOf('BIRTHDATE')],
      age: data[headers.indexOf('PLAYER_AGE')] || calculateAge(data[headers.indexOf('BIRTHDATE')]),
      experience: data[headers.indexOf('SEASON_EXP')],
      school: data[headers.indexOf('SCHOOL')],
      country: data[headers.indexOf('COUNTRY')],
      teamId: data[headers.indexOf('TEAM_ID')],
      teamName: data[headers.indexOf('TEAM_NAME')],
      teamAbbr: data[headers.indexOf('TEAM_ABBREVIATION')],
      draftYear: data[headers.indexOf('DRAFT_YEAR')],
      draftRound: data[headers.indexOf('DRAFT_ROUND')],
      draftNumber: data[headers.indexOf('DRAFT_NUMBER')],
    }
  }

  const getCareerStats = () => {
    if (!playerData?.careerStats?.[0]) return []
    const stats = playerData.careerStats.find((rs: any) => rs.name === 'SeasonTotalsRegularSeason')
    if (!stats) return []
    return stats.rowSet.map((row: any[]) => {
      const headers = stats.headers
      return {
        season: row[headers.indexOf('SEASON_ID')],
        team: row[headers.indexOf('TEAM_ABBREVIATION')],
        age: row[headers.indexOf('PLAYER_AGE')],
        gp: row[headers.indexOf('GP')],
        gs: row[headers.indexOf('GS')],
        min: row[headers.indexOf('MIN')],
        pts: row[headers.indexOf('PTS')],
        reb: row[headers.indexOf('REB')],
        ast: row[headers.indexOf('AST')],
        stl: row[headers.indexOf('STL')],
        blk: row[headers.indexOf('BLK')],
        fgPct: row[headers.indexOf('FG_PCT')],
        fg3Pct: row[headers.indexOf('FG3_PCT')],
        ftPct: row[headers.indexOf('FT_PCT')],
      }
    }).reverse()
  }

  const getRecentGames = () => {
    if (!playerData?.gameLog?.[0]) return []
    const gameLog = playerData.gameLog[0]
    return gameLog.rowSet.slice(0, 10).map((row: any[]) => {
      const headers = gameLog.headers
      return {
        gameId: row[headers.indexOf('Game_ID')],
        date: row[headers.indexOf('GAME_DATE')],
        matchup: row[headers.indexOf('MATCHUP')],
        result: row[headers.indexOf('WL')],
        min: row[headers.indexOf('MIN')],
        pts: row[headers.indexOf('PTS')],
        reb: row[headers.indexOf('REB')],
        ast: row[headers.indexOf('AST')],
        stl: row[headers.indexOf('STL')],
        blk: row[headers.indexOf('BLK')],
        fgm: row[headers.indexOf('FGM')],
        fga: row[headers.indexOf('FGA')],
        fg3m: row[headers.indexOf('FG3M')],
        fg3a: row[headers.indexOf('FG3A')],
        plusMinus: row[headers.indexOf('PLUS_MINUS')],
      }
    })
  }

  const playerInfo = getPlayerInfo()
  const careerStats = getCareerStats()
  const recentGames = getRecentGames()
  const latestSeason = careerStats[0]

  if (loading) {
    return (
      <main className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-10 h-10 border-2 border-surface-3 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-text-secondary">Loading player</p>
        </div>
      </main>
    )
  }

  if (error || !playerInfo) {
    return (
      <main className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <p className="text-text-primary font-semibold mb-4">{error || 'Player not found'}</p>
          <button onClick={() => router.back()}
            className="px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent-dim transition-colors">
            Go back
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-surface-0">
      {/* Nav */}
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
        <button onClick={() => router.back()}
          className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
          Back
        </button>
      </nav>

      <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-text-tertiary mb-8 animate-fade-in">
          <button onClick={() => router.push('/')} className="hover:text-accent transition-colors">Players</button>
          <span>/</span>
          <span className="text-text-primary">{playerInfo.name}</span>
        </div>

        {/* Hero */}
        <div className="flex flex-col md:flex-row gap-8 mb-12 animate-fade-up">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden bg-surface-2 shrink-0">
            <img
              src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${playerId}.png`}
              alt={playerInfo.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-label text-accent uppercase">{playerInfo.teamName}</span>
              <span className="text-text-tertiary">·</span>
              <span className="text-label text-text-tertiary uppercase">#{playerInfo.jersey} · {playerInfo.position}</span>
            </div>
            <h1 className="text-display text-text-primary mb-4">{playerInfo.name}</h1>
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-text-secondary">
              <span>{playerInfo.height} · {playerInfo.weight} lbs</span>
              <span>Age {playerInfo.age}</span>
              <span>{playerInfo.experience} yrs exp</span>
              {playerInfo.school && <span>{playerInfo.school}</span>}
              {playerInfo.draftYear !== 'Undrafted' && (
                <span>{playerInfo.draftYear} Draft · Rd {playerInfo.draftRound}, #{playerInfo.draftNumber}</span>
              )}
            </div>
          </div>
        </div>

        {/* Season Stats */}
        {latestSeason && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-px bg-border rounded-2xl overflow-hidden mb-12 animate-fade-up stagger-1" style={{ opacity: 0 }}>
            {[
              { label: 'PPG', value: latestSeason.pts.toFixed(1), highlight: true },
              { label: 'RPG', value: latestSeason.reb.toFixed(1) },
              { label: 'APG', value: latestSeason.ast.toFixed(1) },
              { label: 'FG%', value: `${(latestSeason.fgPct * 100).toFixed(1)}` },
              { label: '3P%', value: `${(latestSeason.fg3Pct * 100).toFixed(1)}` },
              { label: 'GP', value: latestSeason.gp },
              { label: 'MPG', value: latestSeason.min.toFixed(1) },
            ].map(stat => (
              <div key={stat.label} className="bg-surface-1 p-5 text-center">
                <p className="text-label text-text-tertiary uppercase mb-2">{stat.label}</p>
                <p className={`stat-num text-stat ${stat.highlight ? 'text-accent' : 'text-text-primary'}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Career Chart */}
            {careerStats.length > 0 && (
              <div className="bg-surface-1 border border-border rounded-2xl p-6 animate-fade-up stagger-2" style={{ opacity: 0 }}>
                <h2 className="text-title text-text-primary mb-6">Career Progression</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={careerStats.slice().reverse()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2E" />
                    <XAxis dataKey="season" tick={{ fill: '#8E8E93', fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fill: '#8E8E93', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1A1A1D', border: '1px solid #2A2A2E', borderRadius: '12px', fontSize: '13px' }}
                      labelStyle={{ color: '#FF6B00', fontWeight: '600' }}
                    />
                    <Line type="monotone" dataKey="pts" stroke="#FF6B00" strokeWidth={2.5} name="PPG" dot={{ fill: '#FF6B00', r: 3 }} />
                    <Line type="monotone" dataKey="ast" stroke="#8E8E93" strokeWidth={1.5} name="APG" dot={false} />
                    <Line type="monotone" dataKey="reb" stroke="#5A5A5E" strokeWidth={1.5} name="RPG" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Recent Games */}
            {recentGames.length > 0 && (
              <div className="animate-fade-up stagger-3" style={{ opacity: 0 }}>
                <h2 className="text-title text-text-primary mb-4">Last 10 Games</h2>
                <div className="bg-surface-1 border border-border rounded-2xl overflow-hidden">
                  <div className="hidden md:grid grid-cols-[1fr_50px_50px_50px_50px_70px_50px] gap-2 px-5 py-3 text-label text-text-tertiary uppercase border-b border-border">
                    <span>Game</span>
                    <span className="text-right">PTS</span>
                    <span className="text-right">REB</span>
                    <span className="text-right">AST</span>
                    <span className="text-right">MIN</span>
                    <span className="text-right">FG</span>
                    <span className="text-right">+/-</span>
                  </div>
                  {recentGames.map((game: any, i: number) => (
                    <div key={i} className="hover-row grid grid-cols-[1fr_auto] md:grid-cols-[1fr_50px_50px_50px_50px_70px_50px] gap-2 items-center px-5 py-3 border-b border-border/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${game.result === 'W' ? 'bg-positive' : 'bg-negative'}`} />
                          <span className="text-sm font-medium text-text-primary">{game.matchup}</span>
                        </div>
                        <span className="text-xs text-text-tertiary ml-3.5">{new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="flex md:hidden items-center gap-3 text-sm">
                        <span className="stat-num font-bold text-accent">{game.pts}</span>
                        <span className="stat-num text-text-secondary">{game.reb}</span>
                        <span className="stat-num text-text-secondary">{game.ast}</span>
                      </div>
                      <span className="hidden md:block stat-num text-sm font-bold text-accent text-right">{game.pts}</span>
                      <span className="hidden md:block stat-num text-sm text-text-secondary text-right">{game.reb}</span>
                      <span className="hidden md:block stat-num text-sm text-text-secondary text-right">{game.ast}</span>
                      <span className="hidden md:block stat-num text-sm text-text-tertiary text-right">{game.min}</span>
                      <span className="hidden md:block stat-num text-xs text-text-tertiary text-right">{game.fgm}/{game.fga}</span>
                      <span className={`hidden md:block stat-num text-sm text-right font-medium ${game.plusMinus >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {game.plusMinus >= 0 ? '+' : ''}{game.plusMinus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Career Stats Table */}
            {careerStats.length > 0 && (
              <div className="animate-fade-up stagger-4" style={{ opacity: 0 }}>
                <h2 className="text-title text-text-primary mb-4">Career Stats</h2>
                <div className="bg-surface-1 border border-border rounded-2xl overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-label text-text-tertiary uppercase">Season</th>
                        <th className="text-left py-3 px-4 text-label text-text-tertiary uppercase">Team</th>
                        <th className="text-center py-3 px-4 text-label text-text-tertiary uppercase">GP</th>
                        <th className="text-center py-3 px-4 text-label text-text-tertiary uppercase">MIN</th>
                        <th className="text-center py-3 px-4 text-label text-text-tertiary uppercase">PTS</th>
                        <th className="text-center py-3 px-4 text-label text-text-tertiary uppercase">REB</th>
                        <th className="text-center py-3 px-4 text-label text-text-tertiary uppercase">AST</th>
                        <th className="text-center py-3 px-4 text-label text-text-tertiary uppercase">FG%</th>
                        <th className="text-center py-3 px-4 text-label text-text-tertiary uppercase">3P%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {careerStats.map((season: any, i: number) => (
                        <tr key={i} className="hover-row border-b border-border/50">
                          <td className="py-3 px-4 stat-num text-text-primary font-medium">{season.season}</td>
                          <td className="py-3 px-4 text-text-secondary">{season.team}</td>
                          <td className="py-3 px-4 text-center stat-num text-text-tertiary">{season.gp}</td>
                          <td className="py-3 px-4 text-center stat-num text-text-tertiary">{season.min.toFixed(1)}</td>
                          <td className="py-3 px-4 text-center stat-num text-accent font-semibold">{season.pts.toFixed(1)}</td>
                          <td className="py-3 px-4 text-center stat-num text-text-primary">{season.reb.toFixed(1)}</td>
                          <td className="py-3 px-4 text-center stat-num text-text-primary">{season.ast.toFixed(1)}</td>
                          <td className="py-3 px-4 text-center stat-num text-text-tertiary">{(season.fgPct * 100).toFixed(1)}%</td>
                          <td className="py-3 px-4 text-center stat-num text-text-tertiary">{(season.fg3Pct * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Evaluation Card */}
            {valuationLoading ? (
              <div className="bg-surface-1 border border-border rounded-2xl p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-5 bg-surface-3 rounded w-1/2" />
                  <div className="h-16 bg-surface-3 rounded" />
                  <div className="h-4 bg-surface-3 rounded w-3/4" />
                </div>
              </div>
            ) : valuationData ? (
              <div className="bg-surface-1 border border-accent/30 rounded-2xl p-6 animate-fade-up stagger-1" style={{ opacity: 0 }}>
                <h3 className="text-title text-text-primary mb-5">Player Evaluation</h3>

                <div className="text-center mb-6">
                  <p className={`stat-num text-5xl font-extrabold ${getIndexColor(valuationData.stockIndex)}`}>
                    {valuationData.stockIndex.toFixed(0)}
                  </p>
                  <p className={`text-sm font-semibold mt-1 ${getIndexColor(valuationData.stockIndex)}`}>
                    {getIndexLabel(valuationData.stockIndex)}
                  </p>
                </div>

                <div className="flex justify-center mb-6">
                  <span className={`text-sm font-semibold ${getTrajectoryInfo(valuationData.trajectory).color}`}>
                    {getTrajectoryInfo(valuationData.trajectory).label} Trajectory
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Fair Market AAV</span>
                    <span className="stat-num text-accent font-semibold">{formatCurrency(valuationData.fairAAV)}</span>
                  </div>
                  {valuationData.actualAAV !== null && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Actual AAV</span>
                        <span className="stat-num text-text-primary font-semibold">{formatCurrency(valuationData.actualAAV)}</span>
                      </div>
                      <div className="divider" />
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Surplus Value</span>
                        <span className={`stat-num font-semibold ${valuationData.surplusValue && valuationData.surplusValue >= 0 ? 'text-positive' : 'text-negative'}`}>
                          {valuationData.surplusValue && valuationData.surplusValue >= 0 ? '+' : ''}{formatCurrency(valuationData.surplusValue || 0)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-5 bg-surface-2 rounded-xl p-4">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-text-tertiary">Impact Score</span>
                    <span className="stat-num text-text-primary font-semibold">{valuationData.adjustedImpactScore.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-surface-3 h-1.5 rounded-full">
                    <div className="bg-accent h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((valuationData.adjustedImpactScore / 25) * 100, 100)}%` }} />
                  </div>
                </div>

                <button onClick={() => setShowExplanation(!showExplanation)}
                  className="mt-4 w-full text-left text-sm text-text-tertiary hover:text-text-secondary transition-colors flex items-center justify-between">
                  <span>How is this calculated?</span>
                  <span className="transition-transform duration-200" style={{ transform: showExplanation ? 'rotate(180deg)' : '' }}>▾</span>
                </button>

                {showExplanation && (
                  <div className="mt-4 pt-4 border-t border-border space-y-4 text-xs text-text-tertiary">
                    {valuationData.explanationBreakdown.currentSeasonBreakdown && (
                      <div>
                        <h4 className="text-accent font-semibold mb-2">Per-36 Stats</h4>
                        <div className="grid grid-cols-2 gap-1">
                          <span>PTS: {valuationData.explanationBreakdown.currentSeasonBreakdown.pointsPer36.toFixed(1)}</span>
                          <span>AST: {valuationData.explanationBreakdown.currentSeasonBreakdown.assistsPer36.toFixed(1)}</span>
                          <span>REB: {valuationData.explanationBreakdown.currentSeasonBreakdown.reboundsPer36.toFixed(1)}</span>
                          <span>TS%: {(valuationData.explanationBreakdown.currentSeasonBreakdown.trueShootingPct * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    )}
                    <div>
                      <h4 className="text-accent font-semibold mb-2">Age Factor</h4>
                      <span>Age {valuationData.explanationBreakdown.agingAdjustment.age} · Peak: {valuationData.explanationBreakdown.agingAdjustment.peakAgeRange} · </span>
                      <span className={valuationData.explanationBreakdown.agingAdjustment.adjustmentPercent >= 0 ? 'text-positive' : 'text-negative'}>
                        {valuationData.explanationBreakdown.agingAdjustment.adjustmentPercent >= 0 ? '+' : ''}{valuationData.explanationBreakdown.agingAdjustment.adjustmentPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Bio */}
            <div className="bg-surface-1 border border-border rounded-2xl p-6 animate-fade-up stagger-2" style={{ opacity: 0 }}>
              <h3 className="text-title text-text-primary mb-4">Details</h3>
              <div className="space-y-3 text-sm">
                {[
                  ['Age', playerInfo.age],
                  ['Experience', `${playerInfo.experience} years`],
                  ['Height', playerInfo.height],
                  ['Weight', `${playerInfo.weight} lbs`],
                  ...(playerInfo.school ? [['College', playerInfo.school]] : []),
                  ['Country', playerInfo.country],
                  ...(playerInfo.draftYear !== 'Undrafted' ? [['Draft', `${playerInfo.draftYear} Rd ${playerInfo.draftRound}, #${playerInfo.draftNumber}`]] : []),
                ].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between">
                    <span className="text-text-tertiary">{label}</span>
                    <span className="text-text-primary font-medium text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
