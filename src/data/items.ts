export interface WorkshopItem {
  id: string
  title: string
  owner: string
  game: string
  appId: string
  fileType: string
  previewUrl?: string
  sizeBytes: number
  createdAt: string
  updatedAt: string
  votesUp: number
  votesDown: number
  numChildren: number
  visibility: 'PUBLIC' | 'PRIVATE'
  banned: boolean
  subscriptions: number
  favorites: number
  views: number
  tags: string[]
  descriptionHeading: string
  descriptionIntro: string
  descriptionBullets: string[]
  descriptionOutro: string
  requiresDlc?: string
  dependencies?: string[]
  changelogCount: number
  resolveMs: number
  status: 'ok'
}

export interface CollectionChild {
  id: string
  title: string
  sizeBytes?: number
  status: 'ok' | 'removed' | 'private'
  dependsOn?: string
}

export interface WorkshopCollection {
  id: string
  title: string
  owner: string
  game: string
  updatedAt: string
  numChildren: number
  children: CollectionChild[]
  status: 'ok'
}

const MB = 1024 * 1024

export const items: Record<string, WorkshopItem> = {
  '2874113045': {
    id: '2874113045',
    title: 'Overhauled Rail Network',
    owner: 'vaultkeeper_77',
    game: 'Stellar Drift',
    appId: '2074010',
    fileType: 'COMMUNITY',
    sizeBytes: Math.round(184.2 * MB),
    createdAt: '2022-11-04',
    updatedAt: '2026-06-18',
    votesUp: 18402,
    votesDown: 612,
    numChildren: 0,
    visibility: 'PUBLIC',
    banned: false,
    subscriptions: 241880,
    favorites: 33104,
    views: 1204551,
    tags: ['Transport', 'Buildings', 'Overhaul', 'v2.9-compatible'],
    descriptionHeading: 'Overhauled Rail Network',
    descriptionIntro:
      'Replaces the base game rail system with a signal-aware network. Junctions now resolve priority per-train instead of per-track, and stations expose their throughput to the UI.',
    descriptionBullets: [
      '41 new track pieces, all snap-compatible with vanilla',
      'Signal blocks with visual debug overlay',
      'Rewritten pathfinder, roughly 4× faster on 200+ train saves',
      'Optional freight contracts module',
    ],
    descriptionOutro: 'Requires the Signals DLC. Load after any other transport overhaul.',
    requiresDlc: 'Signals',
    dependencies: ['1902334761', '2233901847', '3104778210'],
    changelogCount: 14,
    resolveMs: 341,
    status: 'ok',
  },
  '1902334761': {
    id: '1902334761',
    title: 'Nightfall Weather Pack',
    owner: 'skybound_mei',
    game: 'Stellar Drift',
    appId: '2074010',
    fileType: 'COMMUNITY',
    sizeBytes: Math.round(42.8 * MB),
    createdAt: '2023-02-11',
    updatedAt: '2026-05-02',
    votesUp: 9120,
    votesDown: 340,
    numChildren: 0,
    visibility: 'PUBLIC',
    banned: false,
    subscriptions: 88400,
    favorites: 12100,
    views: 402118,
    tags: ['Weather', 'Ambience', 'Overhaul'],
    descriptionHeading: 'Nightfall Weather Pack',
    descriptionIntro:
      'Rewrites the night cycle with layered cloud shadows and a slower, denser fog curve. Storms now build over several in-game hours instead of switching on.',
    descriptionBullets: [
      'New cloud shadow pass, no performance cost on the base renderer',
      'Six additional storm variants with distinct wind profiles',
      'Fog density now reacts to altitude',
    ],
    descriptionOutro: 'Safe to add or remove mid-save.',
    dependencies: undefined,
    changelogCount: 6,
    resolveMs: 298,
    status: 'ok',
  },
  '2233901847': {
    id: '2233901847',
    title: 'Faster Build Menu',
    owner: 'hexadecimator',
    game: 'Stellar Drift',
    appId: '2074010',
    fileType: 'COMMUNITY',
    sizeBytes: Math.round(3.1 * MB),
    createdAt: '2024-05-02',
    updatedAt: '2026-02-14',
    votesUp: 1400,
    votesDown: 40,
    numChildren: 0,
    visibility: 'PUBLIC',
    banned: false,
    subscriptions: 15200,
    favorites: 2100,
    views: 61400,
    tags: ['UI', 'QoL'],
    descriptionHeading: 'Faster Build Menu',
    descriptionIntro: 'Cuts the build menu open animation and adds a search box with fuzzy matching over piece names.',
    descriptionBullets: ['Search box with fuzzy match', 'Recently-placed pieces pinned to the top', 'Menu open time down from 280ms to near-instant'],
    descriptionOutro: 'Requires Nightfall Weather Pack for the icon atlas it shares.',
    dependencies: ['1902334761'],
    changelogCount: 3,
    resolveMs: 190,
    status: 'ok',
  },
  '3104778210': {
    id: '3104778210',
    title: 'Cargo Contracts UI',
    owner: 'paperclip_ledger',
    game: 'Stellar Drift',
    appId: '2074010',
    fileType: 'COMMUNITY',
    sizeBytes: Math.round(11.9 * MB),
    createdAt: '2024-01-20',
    updatedAt: '2026-04-11',
    votesUp: 2210,
    votesDown: 60,
    numChildren: 0,
    visibility: 'PUBLIC',
    banned: false,
    subscriptions: 40210,
    favorites: 5100,
    views: 158200,
    tags: ['UI', 'Transport'],
    descriptionHeading: 'Cargo Contracts UI',
    descriptionIntro: 'A clearer contracts board: sortable by payout, distance and expiry, with a running total for accepted contracts.',
    descriptionBullets: ['Sortable columns', 'Running payout total', 'Warns before a contract expires unfulfilled'],
    descriptionOutro: 'Pairs well with Overhauled Rail Network but does not require it.',
    dependencies: undefined,
    changelogCount: 4,
    resolveMs: 210,
    status: 'ok',
  },
  '2455610093': {
    id: '2455610093',
    title: 'Terrain Blend Fixes',
    owner: 'loop_gardener',
    game: 'Stellar Drift',
    appId: '2074010',
    fileType: 'COMMUNITY',
    sizeBytes: Math.round(88.0 * MB),
    createdAt: '2023-08-09',
    updatedAt: '2026-03-30',
    votesUp: 5400,
    votesDown: 210,
    numChildren: 0,
    visibility: 'PUBLIC',
    banned: false,
    subscriptions: 61000,
    favorites: 8300,
    views: 240900,
    tags: ['Terrain', 'Fix'],
    descriptionHeading: 'Terrain Blend Fixes',
    descriptionIntro: 'Retextures the worst of the base game’s cliff and shoreline blends at high texture settings.',
    descriptionBullets: ['New blend maps for all four biomes', 'No change to collision or heightmaps'],
    descriptionOutro: 'Purely cosmetic. Safe with any save.',
    dependencies: undefined,
    changelogCount: 9,
    resolveMs: 265,
    status: 'ok',
  },
}

export type Resolved =
  | { kind: 'item'; item: WorkshopItem }
  | { kind: 'collection'; collection: WorkshopCollection }
  | { kind: 'removed'; id: string; title?: string }
  | { kind: 'private'; id: string; title?: string }
  | { kind: 'not-found'; id: string }

export const donorNames = [
  'vaultkeeper_77',
  'loop_gardener',
  'Mara Vance',
  'tinfoil_dan',
  'Ø-nine',
  'Priya R.',
  'hexadecimator',
  'softlock',
  'Ana Bezerra',
  'nullpointer',
  'Grit',
  'yuki_sh',
  'Dominik W.',
  'carbon.rod',
  'Wren',
  'obsidian_owl',
  'mlem',
  'T. Okonkwo',
  'paperclip maximiser',
  'zzz_sleeper',
  'Kestrel',
  'brine',
  'Ivo',
  'fourteen_frames',
]

export const siteStats = {
  itemsResolved: 1204551,
  gamesCovered: 318,
  medianResolveMs: 341,
  keysDonated: 65,
}

export const seedRecent: { id: string; title: string; sub: string }[] = [
  { id: '2874113045', title: 'Overhauled Rail Network', sub: '184.2 MB' },
  { id: '1902334761', title: 'Nightfall Weather Pack', sub: '42.8 MB' },
  { id: '3011884502', title: 'Essential QoL Collection', sub: '17 items' },
]
