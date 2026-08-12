export type DonatedKeyStatus = 'pending' | 'redeemed-credited' | 'redeemed-anon' | 'invalid'

export interface DonatedKey {
  id: string
  received: string
  game: string | null
  keyMasked: string
  redeemedNote: string | null
  creditsName: string | null
  message: string
  status: DonatedKeyStatus
}

export const donatedKeysCounts = { unredeemed: 7, redeemed: 58, invalid: 4, all: 69 }

export const donatedKeys: DonatedKey[] = [
  {
    id: 'don-1',
    received: '2h ago',
    game: 'Stellar Drift',
    keyMasked: '7KQ2M-•••••-•••••',
    redeemedNote: null,
    creditsName: 'vaultkeeper_77',
    message: 'Spare copy from a bundle. Hope it helps.',
    status: 'pending',
  },
  {
    id: 'don-2',
    received: '6h ago',
    game: null,
    keyMasked: 'QQ84B-•••••-•••••',
    redeemedNote: null,
    creditsName: null,
    message: 'no message',
    status: 'pending',
  },
  {
    id: 'don-3',
    received: 'yesterday',
    game: 'Harrowmere',
    keyMasked: '',
    redeemedNote: 'redeemed · 2026-08-10',
    creditsName: 'Mara Vance',
    message: 'Was hoping someone would cover this one.',
    status: 'redeemed-credited',
  },
  {
    id: 'don-4',
    received: '3d ago',
    game: 'Tin Can Diver',
    keyMasked: '',
    redeemedNote: 'invalid · already used',
    creditsName: 'tinfoil_dan',
    message: '—',
    status: 'invalid',
  },
  {
    id: 'don-5',
    received: '5d ago',
    game: 'Ninefold Abbey',
    keyMasked: '',
    redeemedNote: 'redeemed · 2026-08-06',
    creditsName: null,
    message: 'Please do not credit me.',
    status: 'redeemed-anon',
  },
]

export interface PendingApplication {
  id: string
  name: string | null
  waitDays: number
  stat: string
  flagged: boolean
}

export interface DecidedApplication {
  id: string
  name: string
  outcome: string
  ok: boolean
}

export const apiApplicationsCounts = { pending: 4, slotsOpen: 14, slotsCap: 40 }

export const pendingApplications: PendingApplication[] = [
  { id: 'app-1', name: 'Modpack Archiver', waitDays: 9, stat: '400 req/day · open source', flagged: false },
  { id: 'app-2', name: 'drift-mod-manager', waitDays: 8, stat: '2,000 req/day · closed source', flagged: false },
  { id: 'app-3', name: 'Abbey Wiki Bot', waitDays: 4, stat: '120 req/day · open source', flagged: false },
  { id: 'app-4', name: null, waitDays: 1, stat: 'missing 2 required fields', flagged: true },
]

export const decidedApplications: DecidedApplication[] = [
  { id: 'dec-1', name: 'Stellar Atlas', outcome: 'ISSUED', ok: true },
  { id: 'dec-2', name: 'bulk-workshop-sync', outcome: 'REJECTED · RULE 03', ok: false },
  { id: 'dec-3', name: 'ModVault', outcome: 'REJECTED · NO REPLY', ok: false },
]

export const modpackArchiverDetail = {
  name: 'Modpack Archiver',
  appliedDate: '2026-08-02',
  waitDays: 9,
  fromIpMasked: '81.7.14.•••',
  whatItDoes:
    'Archives modpack manifests for a community of about 900 players so a pack can be rebuilt after items are delisted. Resolves only the items a pack references, once per pack update. Caches everything for a week.',
  contact: 'dan@modpackarchiver.dev',
  statedVolume: '400 / day',
  source: 'git.sr.ht/~dan/archiver',
  commercial: 'no',
  checks: [
    { icon: 'ok' as const, text: 'All four agreements ticked' },
    { icon: 'ok' as const, text: 'Contact domain resolves, MX present' },
    { icon: 'ok' as const, text: 'Stated volume within 2% of daily budget' },
    { icon: 'ok' as const, text: 'No prior rejection from this address' },
    { icon: 'warn' as const, text: 'Site use before applying: 11 days — rule asks for 30' },
    { icon: 'info' as const, text: 'Same address donated a key on 2026-08-09 — donors skip the wait' },
  ],
  issueDefaults: { dailyReadCap: 500, dailyDownloadCap: 50, expires: '90 days, renewable' },
}

export type IssuedKeyStatus = 'active' | 'flagged' | 'revoked'

export interface IssuedKey {
  id: string
  project: string
  keyPrefix: string
  readsToday: number | null
  readsCap: number | null
  downloads: string
  cacheHitPercent: number | null
  lastSeen: string
  flags: string | null
  revokedDate: string | null
  status: IssuedKeyStatus
}

export const issuedKeysCounts = { active: 26, cap: 40 }

export const issuedKeys: IssuedKey[] = [
  {
    id: 'key-1',
    project: 'Stellar Atlas',
    keyPrefix: 'wdl_live_8f2c…',
    readsToday: 170,
    readsCap: 500,
    downloads: '12 / 50',
    cacheHitPercent: 94,
    lastSeen: '4m ago',
    flags: null,
    revokedDate: null,
    status: 'active',
  },
  {
    id: 'key-2',
    project: 'drift-tools',
    keyPrefix: 'wdl_live_b104…',
    readsToday: 1940,
    readsCap: 2000,
    downloads: '88 / 100',
    cacheHitPercent: 41,
    lastSeen: 'just now',
    flags: 'low cache hit · retry storm 09:41',
    revokedDate: null,
    status: 'flagged',
  },
  {
    id: 'key-3',
    project: 'Abbey Wiki Bot',
    keyPrefix: 'wdl_live_5ae9…',
    readsToday: 14,
    readsCap: 120,
    downloads: '0 / 10',
    cacheHitPercent: 99,
    lastSeen: '2h ago',
    flags: null,
    revokedDate: null,
    status: 'active',
  },
  {
    id: 'key-4',
    project: 'bulk-workshop-sync',
    keyPrefix: 'wdl_live_c771…',
    readsToday: null,
    readsCap: null,
    downloads: '—',
    cacheHitPercent: null,
    lastSeen: '14d ago',
    flags: 'rule 03 · catalogue scrape',
    revokedDate: '2026-07-28',
    status: 'revoked',
  },
]
