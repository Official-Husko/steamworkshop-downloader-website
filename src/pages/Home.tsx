import { useEffect, useRef, useState } from 'preact/hooks'
import { Link, useRouter } from '../router'
import { AsciiLogo } from '../components/AsciiLogo'
import { useRecentLookups } from '../hooks/useRecentLookups'
import { parseWorkshopInput } from '../lib/parseWorkshopInput'
import { formatElapsed } from '../lib/format'
import '../styles/home.css'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_ATTEMPTS = 4
const RATE_LIMIT_COOLDOWN_S = 45

export function Home() {
  const { navigate } = useRouter()
  const { entries } = useRecentLookups()
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const [formatsOpen, setFormatsOpen] = useState(false)
  const attemptsRef = useRef<number[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const recentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!rateLimitedUntil) return
    const t = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(t)
  }, [rateLimitedUntil])

  const remainingCooldown = rateLimitedUntil ? Math.max(0, Math.ceil((rateLimitedUntil - now) / 1000)) : 0

  useEffect(() => {
    if (rateLimitedUntil && remainingCooldown <= 0) setRateLimitedUntil(null)
  }, [remainingCooldown, rateLimitedUntil])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function handleSubmit(e: Event) {
    e.preventDefault()
    if (rateLimitedUntil) return
    setError(false)

    const attempts = attemptsRef.current.filter((t) => Date.now() - t < RATE_LIMIT_WINDOW_MS)
    attempts.push(Date.now())
    attemptsRef.current = attempts
    if (attempts.length > RATE_LIMIT_MAX_ATTEMPTS) {
      setRateLimitedUntil(Date.now() + RATE_LIMIT_COOLDOWN_S * 1000)
      return
    }

    const parsed = parseWorkshopInput(value)
    if (!parsed.ok) {
      setError(true)
      return
    }
    navigate(`/items/${parsed.id}`)
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      if (text) setValue(text.trim())
    } catch {
      /* clipboard permission denied — ignore */
    }
    inputRef.current?.focus()
  }

  return (
    <div class="home">
      <div class="home-sweep" aria-hidden="true" />
      <div class="page home-hero">
        <AsciiLogo />
        <p class="home-tagline">DIRECT FILE RETRIEVAL FOR PUBLISHED WORKSHOP ITEMS</p>

        <form class="lookup-form" onSubmit={handleSubmit}>
          <div class="lookup-caption">// paste a workshop URL or a bare published file id</div>
          <div class={error ? 'lookup-bar has-error' : 'lookup-bar'}>
            <span class="lookup-prompt">&gt;</span>
            <input
              ref={inputRef}
              class="lookup-input"
              type="text"
              value={value}
              onInput={(e) => {
                setValue((e.target as HTMLInputElement).value)
                setError(false)
              }}
              placeholder="steamcommunity.com/sharedfiles/filedetails/?id=2874113045"
              autoComplete="off"
              spellcheck={false}
              disabled={!!rateLimitedUntil}
            />
            {!value && <span class="cursor" aria-hidden="true" />}
            <button type="submit" class="lookup-submit" disabled={!!rateLimitedUntil}>
              RESOLVE ⏎
            </button>
          </div>
          <div class="lookup-hints">
            <button type="button" class="hint-btn" onClick={pasteFromClipboard}>
              [TAB] paste from clipboard
            </button>
            <button
              type="button"
              class="hint-btn"
              onClick={() => recentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            >
              [⌘K] history
            </button>
            <button type="button" class="hint-btn" onClick={() => setFormatsOpen((v) => !v)}>
              [?] accepted formats
            </button>
          </div>
          <div class={formatsOpen ? 'formats-panel is-open' : 'formats-panel'}>
            <div class="formats-inner">
              <div>steamcommunity.com/sharedfiles/filedetails/?id=NNNNNNN</div>
              <div>steamcommunity.com/workshop/filedetails/?id=NNNNNNN</div>
              <div>a bare numeric published file id, e.g. 2874113045</div>
            </div>
          </div>
        </form>

        {error && (
          <div class="error-box home-error">
            <div class="box-title">ERR · UNPARSEABLE INPUT</div>
            <div class="box-body">
              That is not a Workshop URL or an item ID. Accepted: a <span class="accent-inline">filedetails</span>{' '}
              link, a <span class="accent-inline">sharedfiles</span> link, or a bare numeric ID.
            </div>
          </div>
        )}

        {rateLimitedUntil && (
          <div class="ok-box home-error">
            <div class="box-title">429 · RATE LIMITED</div>
            <div class="box-body">
              Too many lookups from this address. Retry in{' '}
              <span class="accent-inline">{formatElapsed(remainingCooldown)}</span>. The limit exists to stay
              inside Steam's API budget.
            </div>
          </div>
        )}

        <div class="recent" ref={recentRef}>
          <div class="recent-heading">RECENT ON THIS DEVICE</div>
          {entries.length === 0 ? (
            <div class="recent-empty">Nothing yet. Paste a Workshop link above to get started.</div>
          ) : (
            <div class="recent-list">
              {entries.map((r) => (
                <Link key={r.id} href={`/items/${r.id}`} class="recent-row">
                  <span class="recent-id">{r.id}</span>
                  <span class="recent-title">{r.title}</span>
                  <span class="recent-sub">{r.sub}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
