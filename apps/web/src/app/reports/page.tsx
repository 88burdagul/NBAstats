'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { stockReports, statusLabel, type StockStatus } from '@/lib/stockReports'

type Filter = 'all' | StockStatus

const statusColor: Record<StockStatus, string> = {
  rising: 'text-positive bg-positive/10 border-positive/20',
  falling: 'text-negative bg-negative/10 border-negative/20',
  hold: 'text-accent bg-accent-glow border-accent/20',
}

export default function ReportsPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(() => {
    return stockReports
      .filter((r) => filter === 'all' || r.status === filter)
      .filter((r) => r.playerName.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  }, [query, filter])

  return (
    <main className="min-h-screen bg-surface-0">
      <nav className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-border">
        <div className="flex items-center gap-10">
          <button onClick={() => router.push('/')} className="text-accent text-xl font-extrabold tracking-tight">HOOPMARKET</button>
          <div className="hidden md:flex items-center gap-1">
            {[{ l: 'Players', h: '/' }, { l: 'Teams', h: '/teams' }, { l: 'Compare', h: '/compare' }, { l: 'Games', h: '/games' }, { l: 'Reports', h: '/reports' }].map(link => (
              <button key={link.h} onClick={() => router.push(link.h)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${link.h === '/reports' ? 'text-accent bg-accent-glow' : 'text-text-secondary hover:text-text-primary'}`}>
                {link.l}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-[800px] mx-auto px-6 md:px-10 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-headline text-text-primary">Reports</h1>
          <p className="text-sm text-text-secondary mt-1">Player analysis and intelligence</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-fade-up">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-surface-1 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary"
            placeholder="Search by player..."
          />
          <div className="flex gap-1.5">
            {([{ key: 'all', label: 'All' }, { key: 'rising', label: 'Rising' }, { key: 'falling', label: 'Falling' }, { key: 'hold', label: 'Hold' }] as { key: Filter; label: string }[]).map(b => (
              <button key={b.key} onClick={() => setFilter(b.key)}
                className={`px-3.5 py-2 text-xs font-semibold uppercase tracking-wide rounded-xl transition-colors ${
                  filter === b.key ? 'bg-accent text-white' : 'bg-surface-1 border border-border text-text-secondary hover:text-text-primary'
                }`}>
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <p className="text-center py-16 text-text-tertiary">No reports match your filters.</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((r, i) => (
              <button key={r.slug} onClick={() => router.push(`/reports/${r.slug}`)}
                className={`w-full text-left hover-row bg-surface-1 border border-border rounded-2xl p-5 transition-all animate-fade-up stagger-${(i % 6) + 1}`}
                style={{ opacity: 0 }}>
                <div className="flex items-start gap-4">
                  <img
                    src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${r.playerId}.png`}
                    alt={r.playerName}
                    className="w-12 h-12 rounded-full object-cover bg-surface-2 shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-text-primary">{r.playerName}</span>
                      <span className="text-xs text-text-tertiary">{r.team}</span>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${statusColor[r.status]}`}>
                        {statusLabel(r.status)}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">{r.summary}</p>
                    <span className="text-xs text-text-tertiary mt-2 inline-block">
                      {new Date(r.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
