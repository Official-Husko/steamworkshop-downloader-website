export const trafficHeaderVisitors = '18,904'

/** Stacked per-hour segments (unkeyed scripts amber, downloads dim green,
 * lookups bright green), each a % of the chart's max height — not
 * cumulative, the three stack visually. */
export const hourlyStacks: { unkeyed: number; downloads: number; lookups: number }[] = [
  { unkeyed: 4, downloads: 7, lookups: 14 },
  { unkeyed: 4, downloads: 6, lookups: 11 },
  { unkeyed: 3, downloads: 5, lookups: 9 },
  { unkeyed: 3, downloads: 4, lookups: 7 },
  { unkeyed: 5, downloads: 5, lookups: 9 },
  { unkeyed: 6, downloads: 8, lookups: 15 },
  { unkeyed: 7, downloads: 14, lookups: 26 },
  { unkeyed: 8, downloads: 21, lookups: 41 },
  { unkeyed: 11, downloads: 31, lookups: 58 },
  { unkeyed: 9, downloads: 27, lookups: 52 },
  { unkeyed: 8, downloads: 23, lookups: 43 },
  { unkeyed: 7, downloads: 20, lookups: 39 },
  { unkeyed: 8, downloads: 22, lookups: 41 },
  { unkeyed: 7, downloads: 19, lookups: 37 },
  { unkeyed: 6, downloads: 18, lookups: 34 },
  { unkeyed: 6, downloads: 19, lookups: 36 },
  { unkeyed: 9, downloads: 22, lookups: 41 },
  { unkeyed: 14, downloads: 26, lookups: 48 },
  { unkeyed: 10, downloads: 24, lookups: 45 },
  { unkeyed: 8, downloads: 20, lookups: 37 },
  { unkeyed: 6, downloads: 15, lookups: 28 },
  { unkeyed: 5, downloads: 11, lookups: 21 },
  { unkeyed: 4, downloads: 9, lookups: 17 },
  { unkeyed: 4, downloads: 8, lookups: 14 },
]

export const entryPoints = [
  { label: 'Direct / bookmark', count: '9,104', percent: 48, tier: 'ok' as const },
  { label: 'reddit.com', count: '4,411', percent: 23, tier: 'ok' as const },
  { label: 'Search', count: '2,880', percent: 15, tier: 'dim' as const },
  { label: 'Discord', count: '1,714', percent: 9, tier: 'dim' as const },
  { label: 'steamcommunity.com', count: '795', percent: 4, tier: 'faint' as const },
]

export const countries = [
  { label: 'United States', count: '5,104', percent: 27, tier: 'ok' as const },
  { label: 'Germany', count: '3,218', percent: 17, tier: 'ok' as const },
  { label: 'Russia', count: '1,996', percent: 11, tier: 'dim' as const },
  { label: 'Brazil', count: '1,540', percent: 8, tier: 'dim' as const },
  { label: 'Netherlands', count: '1,388', percent: 7, tier: 'warn' as const },
]
export const countriesNote = 'NL is inflated by one datacentre range — see below.'

export const pageBreakdown = [
  { label: 'Home / lookup', count: '18,904', percent: 100 },
  { label: 'Item detail', count: '14,220', percent: 75 },
  { label: 'Collection', count: '3,104', percent: 16 },
  { label: 'Request a game', count: '881', percent: 5 },
  { label: 'Donate a game', count: '412', percent: 3 },
]

export interface HeavyAddress {
  ip: string
  geo: string
  agent: string
  agentFlagged: boolean
  reqs: string
  egress: string
  note: string
  severity: 'err' | 'dim' | null
  actions: string[]
}

export const heaviestAddresses: HeavyAddress[] = [
  {
    ip: '45.155.203.•••',
    geo: 'NL',
    agent: 'python-requests/2.32',
    agentFlagged: true,
    reqs: '1,402',
    egress: '1.7 TB',
    note: '41% of all egress · no key · ignores Retry-After',
    severity: 'err',
    actions: ['THROTTLE', 'BLOCK /24'],
  },
  {
    ip: '81.7.14.•••',
    geo: 'DE',
    agent: 'Firefox 142 / Linux',
    agentFlagged: false,
    reqs: '148',
    egress: '22 GB',
    note: 'donor · applied for a key',
    severity: null,
    actions: ['REVEAL'],
  },
  {
    ip: '198.51.100.•••',
    geo: 'US',
    agent: 'curl/8.9.1',
    agentFlagged: true,
    reqs: '421',
    egress: '96 GB',
    note: 'matches wdl_live_b104 usage pattern — unkeyed',
    severity: null,
    actions: ['REVEAL', 'THROTTLE'],
  },
  {
    ip: '104.28.90.•••',
    geo: 'US',
    agent: 'Chrome 141 / Windows',
    agentFlagged: false,
    reqs: '64',
    egress: '11 GB',
    note: '—',
    severity: null,
    actions: ['REVEAL'],
  },
]

export const heaviestAddressesNote =
  'Blocking a /24 is reversible and takes effect in 10 seconds. Throttle applies the unkeyed rate limit at a tenth of normal. Neither is announced to the address.'
