'use client'

import { useRouter, useParams } from 'next/navigation'
import { getReportBySlug, statusLabel, type StockStatus, type StockVerdict } from '@/lib/stockReports'

const statusColor: Record<StockStatus, string> = {
  rising: 'text-positive bg-positive/10 border-positive/20',
  falling: 'text-negative bg-negative/10 border-negative/20',
  hold: 'text-accent bg-accent-glow border-accent/20',
}

const verdictColor: Record<StockVerdict, string> = {
  BUY: 'text-positive',
  SELL: 'text-negative',
  HOLD: 'text-accent',
}

export default function ReportDetailPage() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const report = getReportBySlug(params?.slug ?? '')

  if (!report) {
    return (
      <main className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <p className="text-text-primary font-semibold mb-4">Report not found</p>
          <button onClick={() => router.push('/reports')}
            className="px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent-dim transition-colors">
            Back to Reports
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-surface-0">
      <nav className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-border">
        <button onClick={() => router.push('/')} className="text-accent text-xl font-extrabold tracking-tight">HOOPMARKET</button>
        <button onClick={() => router.push('/reports')}
          className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
          All Reports
        </button>
      </nav>

      <div className="max-w-[680px] mx-auto px-6 md:px-10 py-10">
        {/* Header */}
        <div className="mb-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs text-text-tertiary">
              {new Date(report.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${statusColor[report.status]}`}>
              {statusLabel(report.status)}
            </span>
          </div>

          <div className="flex items-center gap-5">
            <img
              src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${report.playerId}.png`}
              alt={report.playerName}
              className="w-20 h-20 rounded-2xl object-cover bg-surface-2"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <div>
              <h1 className="text-display text-text-primary">{report.playerName}</h1>
              <p className="text-sm text-text-tertiary uppercase tracking-wider mt-1">{report.team}</p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <article className="space-y-8 mb-12">
          {[
            { label: 'Current Value', body: report.sections.currentValue },
            { label: "What's Driving It", body: report.sections.whatsDrivingIt },
            { label: 'The Forecast', body: report.sections.theForecast },
          ].map((s, i) => (
            <section key={s.label} className={`animate-fade-up stagger-${i + 1}`} style={{ opacity: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-accent rounded-full" />
                <h2 className="text-label text-accent uppercase">{s.label}</h2>
              </div>
              <p className="text-text-secondary text-base leading-relaxed">{s.body}</p>
            </section>
          ))}
        </article>

        {/* Verdict */}
        <div className="bg-surface-1 border border-border rounded-2xl p-10 text-center animate-fade-up stagger-4" style={{ opacity: 0 }}>
          <p className="text-label text-text-tertiary uppercase tracking-widest mb-3">Verdict</p>
          <p className={`${verdictColor[report.verdict]} text-6xl sm:text-7xl font-extrabold tracking-tight font-mono`}>
            {report.verdict}
          </p>
          <p className="text-xs text-text-tertiary mt-4">HoopMarket Intelligence</p>
        </div>
      </div>
    </main>
  )
}
