export type ParsedInput = { ok: true; id: string } | { ok: false }

/** Accepts a bare published-file id, a filedetails link, or a sharedfiles link. */
export function parseWorkshopInput(raw: string): ParsedInput {
  const input = raw.trim()
  if (!input) return { ok: false }
  if (/^\d+$/.test(input)) return { ok: true, id: input }

  try {
    const url = new URL(input.includes('://') ? input : `https://${input}`)
    const isSteam = /(^|\.)steamcommunity\.com$/i.test(url.hostname)
    const isWorkshopPath = /\/(sharedfiles|workshop)\/filedetails\/?$/i.test(url.pathname)
    const id = url.searchParams.get('id')
    if (isSteam && isWorkshopPath && id && /^\d+$/.test(id)) {
      return { ok: true, id }
    }
  } catch {
    /* not a URL */
  }
  return { ok: false }
}
