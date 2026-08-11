export type QuotaLevel = 'normal' | 'approaching' | 'exhausted' | 'recovering'

// DEMO: there's no real backend yet, so this one constant drives every
// quota-related display on the site (the sitewide banner, the status page,
// and download gating on item/collection pages). Flip it to preview the
// other states — the numbers below are derived from it so everything stays
// consistent.
export const quotaDemoState: QuotaLevel = 'normal'

const FILE_REQUESTS_USED: Record<QuotaLevel, number> = {
  normal: 63412,
  approaching: 92150,
  exhausted: 100000,
  recovering: 8340,
}

const RESET_IN_MS: Record<QuotaLevel, number> = {
  normal: 6 * 3600_000 + 12 * 60_000 + 44_000,
  approaching: 41 * 60_000 + 12_000,
  exhausted: 6 * 3600_000 + 12 * 60_000 + 44_000,
  recovering: 23 * 3600_000 + 47 * 60_000,
}

export const quotaStatus = {
  fileRequests: { used: FILE_REQUESTS_USED[quotaDemoState], limit: 100_000 },
  detailRequests: { used: 88_140, limit: 100_000 },
  peakHour: '08:00–09:00 UTC',
  peakHourCount: 7104,
}

export const quotaResetAt = Date.now() + RESET_IN_MS[quotaDemoState]

export const recoveringQueue = { count: 412, drainPercent: 34 }

export function getQuotaLevel(): QuotaLevel {
  return quotaDemoState
}

export const globalStats = {
  fileRequestsSent: 4_810_000,
  filesDelivered: 3_920_000,
  totalTransferredPB: 1.14,
  medianResolveMs: 341,
}

export const mostDownloaded = {
  game: { name: 'Stellar Drift', items: 881_204, transferTB: 412, sharePercent: 23 },
  mod: { id: '2874113045', name: 'Overhauled Rail Network', pulls: 64_118, transferTB: 11.5 },
}

export interface GameCoverageRow {
  name: string
  appId: string
  items: number
  transferTB: number | null
  status: 'working' | 'partial' | 'broken'
  statusNote?: string
}

export const gameCoverage: GameCoverageRow[] = [
  { name: 'Stellar Drift', appId: '2074010', items: 881_204, transferTB: 412, status: 'working' },
  { name: 'Harrowmere', appId: '1449230', items: 402_551, transferTB: 188, status: 'working' },
  { name: 'Tin Can Diver', appId: '0900117', items: 96_330, transferTB: 27, status: 'partial', statusNote: 'no extractor for .tcd' },
  { name: 'Grease Monkey 2', appId: '1188770', items: 61_908, transferTB: 19, status: 'working' },
  { name: 'Ninefold Abbey', appId: '1770020', items: 40_117, transferTB: 8.2, status: 'partial', statusNote: 'packed archives only' },
  { name: 'Cobalt Wharf', appId: '1602880', items: 12_440, transferTB: null, status: 'broken', statusNote: 'upstream changed format' },
]

export const coverageTotals = { working: 291, partial: 23, broken: 4, totalGames: 318, moreCount: 312 }
