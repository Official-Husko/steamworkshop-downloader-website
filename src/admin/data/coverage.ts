export const coverageHeader = { games: 318, broken: 4 }

export const coverageTiles = [
  { value: '291', label: 'WORKING', tier: 'ok' as const },
  { value: '23', label: 'PARTIAL', tier: 'warn' as const },
  { value: '4', label: 'BROKEN', tier: 'err' as const },
  { value: '14', label: 'EXTRACTORS WRITTEN', tier: 'plain' as const },
  { value: '65', label: 'VIA DONATED KEYS', tier: 'plain' as const },
  { value: '99.1%', label: 'RESOLVE SUCCESS', tier: 'ok' as const },
]

export type CoverageStatus = 'working' | 'partial' | 'broken'

export interface CoverageRow {
  game: string
  appId: string
  items: string
  egress: string
  failPercent: string
  ownership: string
  extractor: string
  status: CoverageStatus
  statusNote: string
  actions: string[]
}

export const coverageRows: CoverageRow[] = [
  {
    game: 'Stellar Drift',
    appId: '2074010',
    items: '881,204',
    egress: '412 TB',
    failPercent: '0.2',
    ownership: 'donated key',
    extractor: 'generic zip',
    status: 'working',
    statusNote: 'Working',
    actions: ['EDIT', 'TEST'],
  },
  {
    game: 'Harrowmere',
    appId: '1449230',
    items: '402,551',
    egress: '188 TB',
    failPercent: '0.4',
    ownership: 'donated key',
    extractor: 'hrw v3',
    status: 'working',
    statusNote: 'Working',
    actions: ['EDIT', 'TEST'],
  },
  {
    game: 'Tin Can Diver',
    appId: '0900117',
    items: '96,330',
    egress: '27 TB',
    failPercent: '3.1',
    ownership: 'donated key',
    extractor: 'none · .tcd',
    status: 'partial',
    statusNote: 'Partial — no extractor, raw file served',
    actions: ['EDIT', 'SAMPLE'],
  },
  {
    game: 'Grease Monkey 2',
    appId: '1188770',
    items: '61,908',
    egress: '19 TB',
    failPercent: '0.1',
    ownership: 'donated key',
    extractor: 'generic zip',
    status: 'working',
    statusNote: 'Working',
    actions: ['EDIT', 'TEST'],
  },
  {
    game: 'Ninefold Abbey',
    appId: '1770020',
    items: '40,117',
    egress: '8.2 TB',
    failPercent: '2.4',
    ownership: 'owned',
    extractor: 'partial · packed',
    status: 'partial',
    statusNote: 'Partial — packed archives only',
    actions: ['EDIT', 'SAMPLE'],
  },
  {
    game: 'Cobalt Wharf',
    appId: '1602880',
    items: '12,440',
    egress: '—',
    failPercent: '100',
    ownership: 'owned',
    extractor: 'cbw v1 · failing',
    status: 'broken',
    statusNote: 'Broken — unknown container magic 0x4357 since 06:14',
    actions: ['LOGS', 'SAMPLE'],
  },
]

export const coverageMoreCount = 312

export const coverageExplain = {
  testSample:
    'Test resolves three known items and runs the extractor on them without touching the public cache. Sample downloads one raw file so you can inspect the container by hand.',
  statusPublic:
    'Whatever you set here appears on the public status table and in the request queue, note included. Broken entries are sorted to the top of the work list by request count.',
}
