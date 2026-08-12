export const SHOW_ON_PAGES = ['ALL PAGES', 'HOME', 'ITEM', 'COLLECTION', 'DONATE', 'API'] as const

export const messageDraft = {
  level: 'WARNING' as 'INFO' | 'WARNING' | 'CRITICAL',
  message: "Steam's API is returning errors for some games. Retry in a few minutes if a lookup fails.",
  linkLabel: 'See status',
  linkTarget: '/status',
  showOn: 'ALL PAGES' as (typeof SHOW_ON_PAGES)[number],
  expires: 'in 6 hours',
  dismissible: true,
}

export interface MessageHistoryEntry {
  title: string
  sub: string
  live: boolean
}

export const messageHistory: MessageHistoryEntry[] = [
  { title: 'Steam API errors', sub: 'live · published 11:02 · expires 17:02', live: true },
  { title: 'Maintenance 02:00–02:40 UTC', sub: 'expired 2026-08-09', live: false },
  { title: 'Thanks for 60 donated keys', sub: 'taken down 2026-07-30', live: false },
]
