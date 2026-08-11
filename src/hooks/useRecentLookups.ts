import { useCallback, useState } from 'preact/hooks'
import { seedRecent } from '../data/items'

export interface RecentEntry {
  id: string
  title: string
  sub: string
}

const KEY = 'wsdl:recent'
const MAX = 6

function load(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as RecentEntry[]
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(seedRecent))
  } catch {
    /* ignore */
  }
  return seedRecent
}

function persist(entries: RecentEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries))
  } catch {
    /* ignore */
  }
}

export function useRecentLookups() {
  const [entries, setEntries] = useState<RecentEntry[]>(load)

  const push = useCallback((entry: RecentEntry) => {
    setEntries((prev) => {
      const next = [entry, ...prev.filter((e) => e.id !== entry.id)].slice(0, MAX)
      persist(next)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setEntries([])
    persist([])
  }, [])

  return { entries, push, clear }
}
