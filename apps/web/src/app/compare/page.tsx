'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

export const dynamic = 'force-dynamic'

interface Player { id: string; name: string; team: string; position: string; ppg: number; rpg: number; apg: number }

interface PlayerComparison {
  id: string; name: string; team: string; position: string; age: number; height: string; weight: string
  stats: { ppg: number; rpg: number; apg: number; fgPct: number; fg3Pct: number; ftPct: number; gp: number; min: number }
  careerStats: { seasons: number; totalPoints: number; totalRebounds: number; totalAssists: number }
}

function ComparePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [player1Id, setPlayer1Id] = useState<string>(searchParams.get('p1') || '')
  const [player2Id, setPlayer2Id] = useState<string>(searchParams.get('p2') || '')
  const [player1Data, setPlayer1Data] = useState<PlayerComparison | null>(null)
  const [player2Data, setPlayer2Data] = useState<PlayerComparison | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchAllPlayers() }, [])
  useEffect(() => { if (player1Id && player2Id) comparePlayers() }, [player1Id, player2Id])

  const fetchAllPlayers = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/players/all`)
      const result = await response.json()
      if (result.success && result.data && result.indices) {
        const { data, indices } = result
        const transformed: Player[] = data
          .filter((p: any[]) => p[indices.gamesPlayed] > 0)
          .map((p: any[]) => ({
            id: String(p[indices.playerId]), name: p[indices.playerName] || 'Unknown',
            team: p[indices.teamAbbrev] || 'FA', position: p[indices.position] || 'N/A',
            ppg: parseFloat(p[indices.points]) || 0, rpg: parseFloat(p[indices.rebounds]) || 0, apg: parseFloat(p[indices.assists]) || 0,
          }))
          .sort((a: Player, b: Player) => a.name.localeCompare(b.name))
        setAllPlayers(transformed)
      }
    } catch (err) { console.error('Error fetching players:', err) }
  }

  const transformPlayerData = (rawPlayer: any): PlayerComparison | null => {
    try {
      if (!rawPlayer?.info) return null
      const infoSet = rawPlayer.info.find((rs: any) => rs.name === 'CommonPlayerInfo')
      if (!infoSet?.rowSet?.[0]) return null
      const infoHeaders = infoSet.headers || []
      const infoRow = infoSet.rowSet[0]
      const getInfo = (h: string) => { const i = infoHeaders.indexOf(h); return i >= 0 ? infoRow[i] : null }

      const careerSet = rawPlayer.careerStats?.find((rs: any) => rs.name === 'SeasonTotalsRegularSeason')
      const careerTotalsSet = rawPlayer.careerStats?.find((rs: any) => rs.name === 'CareerTotalsRegularSeason')
      let stats = { ppg: 0, rpg: 0, apg: 0, fgPct: 0, fg3Pct: 0, ftPct: 0, gp: 0, min: 0 }

      if (careerSet?.rowSet?.length) {
        const h = careerSet.headers || []
        const latest = careerSet.rowSet[careerSet.rowSet.length - 1]
        const g = (k: string) => { const i = h.indexOf(k); return i >= 0 ? (latest[i] || 0) : 0 }
        stats = { ppg: parseFloat(g('PTS')) || 0, rpg: parseFloat(g('REB')) || 0, apg: parseFloat(g('AST')) || 0,
          fgPct: parseFloat(g('FG_PCT')) || 0, fg3Pct: parseFloat(g('FG3_PCT')) || 0, ftPct: parseFloat(g('FT_PCT')) || 0,
          gp: parseInt(g('GP')) || 0, min: parseFloat(g('MIN')) || 0 }
      }

      let career = { seasons: careerSet?.rowSet?.length || 0, totalPoints: 0, totalRebounds: 0, totalAssists: 0 }
      if (careerTotalsSet?.rowSet?.[0]) {
        const h = careerTotalsSet.headers || []
        const r = careerTotalsSet.rowSet[0]
        const g = (k: string) => { const i = h.indexOf(k); return i >= 0 ? (r[i] || 0) : 0 }
        career = { ...career, totalPoints: parseInt(g('PTS')) || 0, totalRebounds: parseInt(g('REB')) || 0, totalAssists: parseInt(g('AST')) || 0 }
      }

      let age = parseInt(getInfo('AGE')) || 0
      if (!age) { const bd = getInfo('BIRTHDATE'); if (bd) age = new Date().getFullYear() - new Date(bd).getFullYear() }

      return {
        id: rawPlayer.id, name: getInfo('DISPLAY_FIRST_LAST') || 'Unknown',
        team: getInfo('TEAM_ABBREVIATION') || 'N/A', position: getInfo('POSITION') || 'N/A',
        age, height: getInfo('HEIGHT') || 'N/A', weight: getInfo('WEIGHT') || 'N/A', stats, careerStats: career,
      }
    } catch { return null }
  }

  const comparePlayers = async () => {
    try {
      setLoading(true); setError('')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/compare/${player1Id}/${player2Id}`)
      const data = await response.json()
      if (data.success) {
        const t1 = transformPlayerData(data.player1), t2 = transformPlayerData(data.player2)
        if (t1 && t2) { setPlayer1Data(t1); setPlayer2Data(t2) }
        else setError('Failed to parse player data.')
      } else setError(data.error || 'Failed to compare players')
      setLoading(false)
    } catch { setError('Failed to fetch comparison data'); setLoading(false) }
  }

  const createChartData = () => {
    if (!player1Data || !player2Data) return []
    const n1 = player1Data.name.split(' ').pop() || 'P1'
    const n2 = player2Data.name.split(' ').pop() || 'P2'
    return [
      { category: 'PPG', [n1]: player1Data.stats.ppg, [n2]: player2Data.stats.ppg },
      { category: 'RPG', [n1]: player1Data.stats.rpg, [n2]: player2Data.stats.rpg },
      { category: 'APG', [n1]: player1Data.stats.apg, [n2]: player2Data.stats.apg },
      { category: 'FG%', [n1]: player1Data.stats.fgPct * 100, [n2]: player2Data.stats.fgPct * 100 },
      { category: '3P%', [n1]: player1Data.stats.fg3Pct * 100, [n2]: player2Data.stats.fg3Pct * 100 },
    ]
  }

  const createRadarData = () => {
    if (!player1Data || !player2Data) return []
    const n1 = player1Data.name.split(' ').pop() || 'P1'
    const n2 = player2Data.name.split(' ').pop() || 'P2'
    return [
      { stat: 'Scoring', [n1]: Math.min(player1Data.stats.ppg * 3, 100), [n2]: Math.min(player2Data.stats.ppg * 3, 100) },
      { stat: 'Rebounds', [n1]: Math.min(player1Data.stats.rpg * 8, 100), [n2]: Math.min(player2Data.stats.rpg * 8, 100) },
      { stat: 'Assists', [n1]: Math.min(player1Data.stats.apg * 8, 100), [n2]: Math.min(player2Data.stats.apg * 8, 100) },
      { stat: 'Efficiency', [n1]: player1Data.stats.fgPct * 200, [n2]: player2Data.stats.fgPct * 200 },
      { stat: 'Experience', [n1]: Math.min(player1Data.careerStats.seasons * 10, 100), [n2]: Math.min(player2Data.careerStats.seasons * 10, 100) },
    ]
  }

  const StatRow = ({ label, v1, v2 }: { label: string; v1: string; v2: string }) => {
    const n1 = parseFloat(v1), n2 = parseFloat(v2)
    const better1 = !isNaN(n1) && !isNaN(n2) && n1 > n2
    const better2 = !isNaN(n1) && !isNaN(n2) && n2 > n1
    return (
      <div className="grid grid-cols-3 gap-4 py-3 border-b border-border/50">
        <span className={`stat-num text-sm text-right font-semibold ${better1 ? 'text-accent' : 'text-text-secondary'}`}>{v1}</span>
        <span className="text-label text-text-tertiary uppercase text-center self-center">{label}</span>
        <span className={`stat-num text-sm font-semibold ${better2 ? 'text-accent' : 'text-text-secondary'}`}>{v2}</span>
      </div>
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
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${link.h === '/compare' ? 'text-accent bg-accent-glow' : 'text-text-secondary hover:text-text-primary'}`}>
                {link.l}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-[1000px] mx-auto px-6 md:px-10 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-headline text-text-primary">Compare Players</h1>
          <p className="text-sm text-text-secondary mt-1">Side-by-side performance analysis</p>
        </div>

        {/* Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 animate-fade-up">
          <div>
            <label className="text-label text-text-tertiary uppercase mb-2 block">Player 1</label>
            <select value={player1Id} onChange={(e) => setPlayer1Id(e.target.value)}
              className="w-full bg-surface-1 border border-border rounded-xl px-4 py-3 text-sm text-text-primary">
              <option value="">Select a player...</option>
              {allPlayers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.team}) — {p.ppg.toFixed(1)} PPG</option>)}
            </select>
          </div>
          <div>
            <label className="text-label text-text-tertiary uppercase mb-2 block">Player 2</label>
            <select value={player2Id} onChange={(e) => setPlayer2Id(e.target.value)}
              className="w-full bg-surface-1 border border-border rounded-xl px-4 py-3 text-sm text-text-primary">
              <option value="">Select a player...</option>
              {allPlayers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.team}) — {p.ppg.toFixed(1)} PPG</option>)}
            </select>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 animate-fade-in">
            <div className="w-10 h-10 border-2 border-surface-3 border-t-accent rounded-full animate-spin" />
          </div>
        )}

        {!loading && player1Data && player2Data && (() => {
          const n1 = player1Data.name.split(' ').pop() || 'P1'
          const n2 = player2Data.name.split(' ').pop() || 'P2'
          return (
            <div className="space-y-8 animate-fade-up">
              {/* Player headers */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-right">
                  <p className="text-title text-text-primary">{player1Data.name}</p>
                  <p className="text-xs text-text-tertiary">{player1Data.team} · {player1Data.position} · Age {player1Data.age}</p>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-label text-text-tertiary">VS</span>
                </div>
                <div>
                  <p className="text-title text-text-primary">{player2Data.name}</p>
                  <p className="text-xs text-text-tertiary">{player2Data.team} · {player2Data.position} · Age {player2Data.age}</p>
                </div>
              </div>

              {/* Head to head stats */}
              <div className="bg-surface-1 border border-border rounded-2xl p-6">
                <StatRow label="PPG" v1={player1Data.stats.ppg.toFixed(1)} v2={player2Data.stats.ppg.toFixed(1)} />
                <StatRow label="RPG" v1={player1Data.stats.rpg.toFixed(1)} v2={player2Data.stats.rpg.toFixed(1)} />
                <StatRow label="APG" v1={player1Data.stats.apg.toFixed(1)} v2={player2Data.stats.apg.toFixed(1)} />
                <StatRow label="FG%" v1={`${(player1Data.stats.fgPct * 100).toFixed(1)}%`} v2={`${(player2Data.stats.fgPct * 100).toFixed(1)}%`} />
                <StatRow label="3P%" v1={`${(player1Data.stats.fg3Pct * 100).toFixed(1)}%`} v2={`${(player2Data.stats.fg3Pct * 100).toFixed(1)}%`} />
                <StatRow label="GP" v1={String(player1Data.stats.gp)} v2={String(player2Data.stats.gp)} />
                <StatRow label="MPG" v1={player1Data.stats.min.toFixed(1)} v2={player2Data.stats.min.toFixed(1)} />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface-1 border border-border rounded-2xl p-6">
                  <h3 className="text-title text-text-primary mb-4">Stats Comparison</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={createChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2E" />
                      <XAxis dataKey="category" tick={{ fill: '#8E8E93', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#8E8E93', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1A1A1D', border: '1px solid #2A2A2E', borderRadius: '12px', fontSize: '13px' }} />
                      <Legend />
                      <Bar dataKey={n1} fill="#FF6B00" radius={[4, 4, 0, 0]} />
                      <Bar dataKey={n2} fill="#8E8E93" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-surface-1 border border-border rounded-2xl p-6">
                  <h3 className="text-title text-text-primary mb-4">Skill Radar</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={createRadarData()}>
                      <PolarGrid stroke="#2A2A2E" />
                      <PolarAngleAxis dataKey="stat" tick={{ fill: '#8E8E93', fontSize: 11 }} />
                      <PolarRadiusAxis tick={false} axisLine={false} />
                      <Radar name={n1} dataKey={n1} stroke="#FF6B00" fill="#FF6B00" fillOpacity={0.2} />
                      <Radar name={n2} dataKey={n2} stroke="#8E8E93" fill="#8E8E93" fillOpacity={0.15} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Career totals */}
              <div className="bg-surface-1 border border-border rounded-2xl p-6">
                <h3 className="text-title text-text-primary mb-4">Career Totals</h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  {[
                    { label: 'Points', v1: player1Data.careerStats.totalPoints, v2: player2Data.careerStats.totalPoints },
                    { label: 'Rebounds', v1: player1Data.careerStats.totalRebounds, v2: player2Data.careerStats.totalRebounds },
                    { label: 'Assists', v1: player1Data.careerStats.totalAssists, v2: player2Data.careerStats.totalAssists },
                    { label: 'Seasons', v1: player1Data.careerStats.seasons, v2: player2Data.careerStats.seasons },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-label text-text-tertiary uppercase mb-3">{item.label}</p>
                      <p className={`stat-num text-lg font-bold ${item.v1 > item.v2 ? 'text-accent' : 'text-text-secondary'}`}>{item.v1.toLocaleString()}</p>
                      <p className={`stat-num text-lg font-bold mt-1 ${item.v2 > item.v1 ? 'text-accent' : 'text-text-secondary'}`}>{item.v2.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })()}

        {!loading && !player1Data && !player2Data && !error && (
          <div className="text-center py-20 animate-fade-in">
            <p className="text-text-secondary">Select two players above to compare</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-surface-1 border border-negative/20 rounded-2xl p-8 text-center animate-fade-in">
            <p className="text-text-primary font-semibold">{error}</p>
          </div>
        )}
      </div>
    </main>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-surface-3 border-t-accent rounded-full animate-spin" />
      </div>
    }>
      <ComparePageContent />
    </Suspense>
  )
}
