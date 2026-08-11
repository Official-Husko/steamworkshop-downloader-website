export type RequestStatus = 'needs-key' | 'covered' | 'no-workshop'

export interface GameRequest {
  appId: string
  name: string
  count: number
  status: RequestStatus
  coveredDate?: string
  note?: string
}

export const gameRequests: GameRequest[] = [
  { appId: '2074010', name: 'Stellar Drift', count: 412, status: 'needs-key' },
  { appId: '1449230', name: 'Harrowmere', count: 288, status: 'needs-key' },
  { appId: '0900117', name: 'Tin Can Diver', count: 241, status: 'covered', coveredDate: '2026-08-02' },
  { appId: '1188770', name: 'Grease Monkey 2', count: 173, status: 'needs-key' },
  { appId: '2310044', name: 'Loft & Ladder', count: 96, status: 'no-workshop', note: 'no Workshop for this game' },
  { appId: '1770020', name: 'Ninefold Abbey', count: 61, status: 'needs-key' },
  { appId: '2455112', name: 'Copper Horizon', count: 44, status: 'needs-key' },
  { appId: '1893004', name: 'Undertow Marina', count: 37, status: 'needs-key' },
]

export const moreGameRequests: GameRequest[] = [
  { appId: '2611908', name: 'Glasswing Circuit', count: 29, status: 'needs-key' },
  { appId: '1704455', name: 'Paper Lantern Trail', count: 18, status: 'needs-key' },
  { appId: '2098871', name: 'Foghorn Freight Co.', count: 12, status: 'needs-key' },
]

export const requestTotals = {
  all: 214,
  needsKey: 189,
  covered: 21,
  noWorkshop: 4,
}

export function mostRequestedNeedingKey(limit: number): GameRequest[] {
  return [...gameRequests, ...moreGameRequests]
    .filter((g) => g.status === 'needs-key')
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
