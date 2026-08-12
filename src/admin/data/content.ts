export const STATUS_OPTIONS = [
  'OPEN · NEEDS A KEY',
  'COVERED · WORKING',
  'COVERED · PARTIAL',
  'COVERED · BROKEN',
  'CLOSED · NO WORKSHOP',
  'CLOSED · SERVER-SIDE ONLY',
] as const

export type GameStatus = (typeof STATUS_OPTIONS)[number]

export interface AdminGameRequest {
  id: string
  reqs: number
  appId: string
  game: string
  status: GameStatus
  displayLabel?: string
  publicNote: string
  closed?: boolean
}

export const requestedGamesCounts = { total: 214, coveredGames: 318, open: 189, covered: 21, closed: 4, merged: 0 }

export const requestedGames: AdminGameRequest[] = [
  {
    id: 'rg-1',
    reqs: 412,
    appId: '2074010',
    game: 'Stellar Drift',
    status: 'OPEN · NEEDS A KEY',
    publicNote: 'Waiting on a donated key.',
  },
  {
    id: 'rg-2',
    reqs: 241,
    appId: '0900117',
    game: 'Tin Can Diver',
    status: 'COVERED · PARTIAL',
    displayLabel: 'PARTIAL — MISSING EXTRACTOR',
    publicNote: 'Downloads work, we cannot unpack .tcd containers — you get the raw file.',
  },
  {
    id: 'rg-3',
    reqs: 173,
    appId: '1188770',
    game: 'Grease Monkey 2',
    status: 'COVERED · WORKING',
    publicNote: 'Covered 2026-07-14 by a donated key.',
  },
  {
    id: 'rg-4',
    reqs: 96,
    appId: '1602880',
    game: 'Cobalt Wharf',
    status: 'COVERED · BROKEN',
    publicNote: 'Upstream changed the container format. Being looked at.',
  },
  {
    id: 'rg-5',
    reqs: 61,
    appId: '2310044',
    game: 'Loft & Ladder',
    status: 'CLOSED · NO WORKSHOP',
    publicNote: 'Game has no Workshop. Nothing to resolve.',
    closed: true,
  },
]
