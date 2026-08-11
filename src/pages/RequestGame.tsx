import { useMemo, useState } from 'preact/hooks'
import { Link } from '../router'
import { gameRequests as seedRequests, moreGameRequests, requestTotals, type GameRequest } from '../data/requests'
import { useSEO } from '../hooks/useSEO'
import { Dropdown } from '../components/Dropdown'
import '../styles/docs.css'
import '../styles/request.css'

type FilterKey = 'all' | 'needs-key' | 'covered' | 'no-workshop'
type SortKey = 'requests' | 'name'

const FILTERS: { key: FilterKey; label: string; count: number }[] = [
  { key: 'all', label: 'ALL', count: requestTotals.all },
  { key: 'needs-key', label: 'NEEDS A KEY', count: requestTotals.needsKey },
  { key: 'covered', label: 'COVERED', count: requestTotals.covered },
  { key: 'no-workshop', label: 'NOT POSSIBLE', count: requestTotals.noWorkshop },
]

let nextAppId = 9_000_000

export function RequestGame() {
  useSEO({
    title: 'Request a Game',
    description: 'Ask for a game MODRELAY does not cover yet. Requests are what donors use to decide which key to send.',
    path: '/request',
  })

  const [requests, setRequests] = useState<GameRequest[]>(seedRequests)
  const [expanded, setExpanded] = useState(false)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [sort, setSort] = useState<SortKey>('requests')
  const [input, setInput] = useState('')
  const [justAdded, setJustAdded] = useState<string | null>(null)

  const allRequests = expanded ? [...requests, ...moreGameRequests] : requests

  const visible = useMemo(() => {
    const list = filter === 'all' ? allRequests : allRequests.filter((r) => r.status === filter)
    const sorted = [...list]
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name))
    else sorted.sort((a, b) => b.count - a.count)
    return sorted
  }, [allRequests, filter, sort])

  function upvote(appId: string) {
    setRequests((rs) => rs.map((r) => (r.appId === appId ? { ...r, count: r.count + 1 } : r)))
  }

  function handleAdd(e: Event) {
    e.preventDefault()
    const name = input.trim()
    if (!name) return

    const existing = requests.find((r) => r.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      upvote(existing.appId)
      setJustAdded(existing.appId)
    } else {
      const appId = String(nextAppId++)
      setRequests((rs) => [{ appId, name, count: 1, status: 'needs-key' }, ...rs])
      setJustAdded(appId)
    }
    setInput('')
    window.setTimeout(() => setJustAdded(null), 1600)
  }

  return (
    <div class="page request-page">
      <div class="doc-kicker">$ ./request --app</div>
      <h1 class="doc-title">Ask for a game we do not cover</h1>
      <p class="doc-copy" style={{ marginBottom: '30px' }}>
        Coverage is limited to games the service owns. Requesting one adds it to the queue below; the count is what
        donors use to decide which key to send. Nothing here obligates anyone to buy anything.
      </p>

      <form class="request-add" onSubmit={handleAdd}>
        <div class="request-add-bar">
          <span class="request-add-prompt">&gt;</span>
          <input
            class="request-add-input"
            value={input}
            onInput={(e) => setInput((e.target as HTMLInputElement).value)}
            placeholder="game name, Steam store URL, or app id"
            autoComplete="off"
          />
          {!input && <span class="cursor" aria-hidden="true" />}
        </div>
        <button type="submit" class="btn btn-primary">
          ADD REQUEST
        </button>
      </form>

      <div class="request-toolbar">
        {FILTERS.map((f) => (
          <button
            type="button"
            key={f.key}
            class={filter === f.key ? 'request-filter is-active' : 'request-filter'}
            onClick={() => setFilter(f.key)}
          >
            {f.label} {f.count}
          </button>
        ))}
        <div class="request-sort">
          sort:
          <Dropdown
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            ariaLabel="Sort requests"
            options={[
              { value: 'requests', label: 'requests' },
              { value: 'name', label: 'name' },
            ]}
          />
        </div>
      </div>

      <div class="request-list">
        {visible.map((r) => (
          <div class={`request-row${justAdded === r.appId ? ' is-added' : ''}`} key={r.appId}>
            <span class="request-count">{r.count}</span>
            <span class="request-appid">{r.appId}</span>
            <span class={r.status === 'no-workshop' ? 'request-name is-muted' : 'request-name'}>{r.name}</span>
            {r.status === 'needs-key' && <span class="request-badge is-warn">NEEDS A KEY</span>}
            {r.status === 'covered' && <span class="request-badge is-ok">COVERED {r.coveredDate}</span>}
            {r.status === 'no-workshop' && <span class="request-badge is-err">NO WORKSHOP</span>}
            {r.status === 'needs-key' ? (
              <button type="button" class="request-upvote" onClick={() => upvote(r.appId)}>
                +1
              </button>
            ) : (
              <span class="request-done">{r.status === 'covered' ? 'done' : 'closed'}</span>
            )}
          </div>
        ))}
        {!expanded && (
          <button type="button" class="request-expand" onClick={() => setExpanded(true)}>
            {moreGameRequests.length} more · <span class="accent-inline">load next 50</span>
          </button>
        )}
      </div>

      <div class="request-cta">
        <div class="request-cta-text">
          Own a spare copy of something near the top? A single key clears the whole queue entry for everyone who
          asked.
        </div>
        <Link href="/donate" class="btn btn-outline request-cta-btn">
          DONATE A GAME →
        </Link>
      </div>

      <div class="doc-legal" style={{ marginTop: '18px' }}>
        One request per game per device. Requests for games without a Workshop, or where the Workshop is server-side
        only, are closed with a reason.
      </div>
    </div>
  )
}
