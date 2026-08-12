import { nameHue } from '../../lib/hue'

export const creditsHeader = { shown: 24, anonymous: 41 }
export const creditsFilterCounts = { shown: 24, hidden: 3, needsReview: 2, anonymous: 41 }

export interface CreditsRow {
  name: string
  game: string
  date: string
  flag: string | null
}

const RAW_ROWS: CreditsRow[] = [
  { name: 'vaultkeeper_77', game: 'Stellar Drift', date: '2h ago', flag: null },
  { name: 'Mara Vance', game: 'Harrowmere', date: '2026-08-10', flag: null },
  { name: 'tinfoil_dan', game: 'Tin Can Diver', date: '2026-08-08', flag: 'key was invalid — name held back' },
  { name: 'loop_gardener', game: 'Grease Monkey 2', date: '2026-07-14', flag: null },
  { name: 'Ø-nine', game: 'Ninefold Abbey', date: '2026-07-02', flag: null },
  { name: 'hexadecimator', game: 'not given', date: '2026-06-28', flag: 'removal requested 2026-08-11' },
  { name: 'softlock', game: 'Cobalt Wharf', date: '2026-06-19', flag: null },
]

export const creditsRows = RAW_ROWS.map((r) => ({
  ...r,
  hue: String(nameHue(r.name)).padStart(3, '0'),
}))

export const creditsMoreShownCount = 17

export const creditsPreviewChips = [
  'vaultkeeper_77',
  'Mara Vance',
  'loop_gardener',
  'Ø-nine',
  'softlock',
  'Priya R.',
  'nullpointer',
  'Grit',
  'yuki_sh',
  'carbon.rod',
  'Wren',
  'obsidian_owl',
  'T. Okonkwo',
  'Kestrel',
  'brine',
  'Ivo',
]

export const addNameDraft = {
  name: 'paperclip maximiser',
  linkedDonation: '#612',
  game: 'from donation',
}
