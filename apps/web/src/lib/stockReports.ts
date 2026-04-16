export type StockStatus = 'rising' | 'falling' | 'hold'
export type StockVerdict = 'BUY' | 'HOLD' | 'SELL'

export interface StockReport {
  slug: string
  playerId: string
  playerName: string
  team: string
  status: StockStatus
  verdict: StockVerdict
  summary: string
  publishedAt: string
  sections: {
    currentValue: string
    whatsDrivingIt: string
    theForecast: string
  }
}

export const stockReports: StockReport[] = [
  {
    slug: 'ja-morant-rising',
    playerId: '1629630',
    playerName: 'Ja Morant',
    team: 'MEM',
    status: 'rising',
    verdict: 'BUY',
    summary:
      'Morant is back to All-NBA form, posting 26.4 PPG and 8.1 APG on lifted efficiency since March — upside case is reactivated.',
    publishedAt: '2026-04-12',
    sections: {
      currentValue:
        'After an inconsistent first half, Morant has logged six straight games of 25+ points and 7+ assists, shooting 49% from the floor and 38% from three. His usage rate is back above 30% and Memphis is 8-2 in that stretch. The market had him priced as a mid-tier starter; current production reads closer to a top-12 guard.',
      whatsDrivingIt:
        'Two things. First, health — no missed games since the All-Star break, and his burst at the rim looks fully restored. Second, role clarity. With Memphis running more two-man action through him and Jackson Jr., his rim pressure is up 22% and his assist-to-turnover ratio has jumped from 2.1 to 3.4. Playoff narrative is building alongside the stats.',
      theForecast:
        'Expect continued volatility, but the floor has clearly moved up. If Memphis gets a top-six seed, Morant enters the postseason as the best scoring guard in the West outside of Curry and SGA. Short-term target: another 6-8% appreciation over the next two weeks. Long-term, he is a high-beta asset — ride the momentum now and reassess at the playoff tip.',
    },
  },
  {
    slug: 'zach-lavine-falling',
    playerId: '203897',
    playerName: 'Zach LaVine',
    team: 'SAC',
    status: 'falling',
    verdict: 'SELL',
    summary:
      'LaVine’s scoring volume masks collapsing efficiency and a shrinking role in Sacramento’s offense — exit before the summer news cycle.',
    publishedAt: '2026-04-11',
    sections: {
      currentValue:
        'The counting stats still look fine on the surface — 22.1 PPG, 4.3 APG — but the underlying numbers have cracked. True shooting percentage is down to 54.3% from 60.1% a year ago, and he is posting a -4.8 on/off differential, the worst of any Kings starter. The market is still pricing him on name recognition, not current output.',
      whatsDrivingIt:
        'The fit in Sacramento never fully clicked. He is taking fewer shots at the rim (career low), settling for long twos, and his defensive possessions continue to be hunted by opposing guards. Trade speculation has quieted down, which removes the main catalyst that was propping up his value at the deadline.',
      theForecast:
        'Downside risk outweighs upside through the offseason. Expect his asset value to drift another 10-15% lower as free agency conversations highlight a shrinking market for 30-year-old high-usage wings with injury history. Unless Sacramento overhauls the roster around him, there is no clear path back to 2021 Zach. Lock in what value remains.',
    },
  },
  {
    slug: 'tyrese-haliburton-hold',
    playerId: '1630169',
    playerName: 'Tyrese Haliburton',
    team: 'IND',
    status: 'hold',
    verdict: 'HOLD',
    summary:
      'Haliburton’s production has stabilized after a rocky stretch — not a breakout, not a decline. Wait for the playoff tape.',
    publishedAt: '2026-04-10',
    sections: {
      currentValue:
        'Post All-Star Haliburton is averaging 19.8 PPG and 11.2 APG on solid but unspectacular efficiency. That is a step back from his 2023-24 All-NBA season, but a clear recovery from his January slump. He remains Indiana’s offensive engine, and the Pacers are 24-12 when he plays 32+ minutes.',
      whatsDrivingIt:
        'The market overreacted to a midseason hamstring issue and a few cold shooting weeks. His passing reads are still elite — top 3 in potential assists per game — but his scoring gravity has dipped, and defenses are going under screens more aggressively. That puts a soft ceiling on his box scores until the jumper comes back.',
      theForecast:
        'No strong directional signal. The next 15 games and a playoff series will decide whether he re-rates as a top-10 player or settles in as a high-end All-Star. Hold the position, reassess after round one. Pacers’ pace and scheme insulate his floor; his ceiling is tied to a single shooting variable.',
    },
  },
]

export const getRecentReports = (limit = 3): StockReport[] =>
  [...stockReports]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit)

export const getReportBySlug = (slug: string): StockReport | undefined =>
  stockReports.find((r) => r.slug === slug)

export const statusLabel = (status: StockStatus): string =>
  status === 'rising' ? 'Stock Rising' : status === 'falling' ? 'Stock Falling' : 'Hold'
