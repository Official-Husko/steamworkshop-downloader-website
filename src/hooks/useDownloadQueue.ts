import { useCallback, useState } from 'preact/hooks'

const KEY = 'wsdl:download-queue'

function load(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as string[]
  } catch {
    /* ignore */
  }
  return []
}

function persist(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids))
  } catch {
    /* ignore */
  }
}

/** Client-only download queue for when the daily Steam quota is exhausted.
 * Held in localStorage, never sent anywhere; matches what the banner says
 * ("closing the tab clears the queue" is aspirational for a future tab-scoped
 * version, but persisting across reloads is friendlier for a demo). */
export function useDownloadQueue() {
  const [ids, setIds] = useState<string[]>(load)

  const enqueue = useCallback((id: string) => {
    setIds((prev) => {
      if (prev.includes(id)) return prev
      const next = [...prev, id]
      persist(next)
      return next
    })
  }, [])

  const isQueued = useCallback((id: string) => ids.includes(id), [ids])

  return { ids, enqueue, isQueued }
}
