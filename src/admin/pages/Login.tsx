import { useEffect, useState } from 'preact/hooks'
import { TypewriterText } from '../../components/TypewriterText'
import { useCountdown } from '../../hooks/useCountdown'
import { formatCountdown } from '../../lib/format'
import { useAdminSession } from '../lib/session'
import { useRouter } from '../../router'
import '../styles/auth.css'

const GLYPH = ` 
 █████  ██████  ███    ███ ██ ███    ██
██   ██ ██   ██ ████  ████ ██ ████   ██
███████ ██   ██ ██ ████ ██ ██ ██ ██  ██
██   ██ ██   ██ ██  ██  ██ ██ ██  ██ ██
██   ██ ██████  ██      ██ ██ ██   ████`

const TRANSCRIPT: [number, string][] = [
  [0, 'code accepted'],
  [400, 'session 4h · expires {expires}'],
  [700, 'role operator'],
  [1000, '3 items need attention'],
]

export function Login() {
  const { attempt, isLocked, lockedUntil, expiresAt } = useAdminSession()
  const { navigate } = useRouter()
  const [code, setCode] = useState('')
  const [phase, setPhase] = useState<'entry' | 'accepted'>('entry')
  const [visibleLines, setVisibleLines] = useState(0)
  const [showPanel, setShowPanel] = useState(false)

  const lockRemaining = useCountdown(lockedUntil ?? 0)
  const expiresLabel = expiresAt ? new Date(expiresAt).toISOString().slice(11, 16) + ' UTC' : ''

  function handleSubmit(e: Event) {
    e.preventDefault()
    if (isLocked) return
    const result = attempt(code)
    if (result === 'ok') {
      setPhase('accepted')
    } else {
      setCode('')
    }
  }

  useEffect(() => {
    if (phase !== 'accepted') return
    const timers = TRANSCRIPT.map((_, i) =>
      window.setTimeout(() => setVisibleLines(i + 1), TRANSCRIPT[i][0]),
    )
    const panelTimer = window.setTimeout(() => setShowPanel(true), 1200)
    const navTimer = window.setTimeout(() => navigate('/'), 2600)
    return () => {
      timers.forEach(window.clearTimeout)
      window.clearTimeout(panelTimer)
      window.clearTimeout(navTimer)
    }
  }, [phase, navigate])

  if (isLocked) {
    return (
      <div class="admin-auth is-locked">
        <div class="admin-auth-card">
          <TypewriterText as="pre" class="admin-auth-glyph is-locked" text={GLYPH} typeMs={4} aria-label="ADMIN" />
          <div class="admin-auth-subhead is-locked">LOCKED · TOO MANY ATTEMPTS</div>

          <div class="admin-auth-lockbox">
            <div class="admin-auth-lockbox-title">3 OF 3 ATTEMPTS USED</div>
            <p class="admin-auth-lockbox-body">
              This address is blocked from further attempts. The lockout doubles each time it triggers.
            </p>
            <div class="admin-auth-countdown-row">
              <span class="admin-auth-countdown">{formatCountdown(lockRemaining).replace(/^00:/, '')}</span>
              <span class="admin-auth-countdown-label">REMAINING</span>
            </div>
          </div>

          <div class="admin-auth-recorded">
            <div class="admin-auth-recorded-title">RECORDED</div>
            <div class="admin-auth-recorded-row">
              <span>ip</span>
              <span>81.7.14.•••</span>
            </div>
            <div class="admin-auth-recorded-row">
              <span>agent</span>
              <span>Firefox 142 / Linux</span>
            </div>
            <div class="admin-auth-recorded-row">
              <span>first attempt</span>
              <span>11:04:22 UTC</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'accepted') {
    return (
      <div class="admin-auth">
        <div class="admin-auth-card admin-auth-transcript">
          <div class="admin-auth-cmd">$ auth --code ······</div>
          {TRANSCRIPT.slice(0, visibleLines).map(([t, text], i) => {
            const rendered = text.replace('{expires}', expiresLabel)
            const isLast = i === TRANSCRIPT.length - 1
            return (
              <div class="admin-log-line" key={t}>
                <span class="admin-log-ts">[{(t / 1000).toFixed(2).padStart(5, '0')}]</span>
                <span>{rendered}</span>
                {isLast && visibleLines === TRANSCRIPT.length && !showPanel && (
                  <span class="cursor log-cursor" aria-hidden="true" />
                )}
              </div>
            )
          })}

          {showPanel && (
            <>
              <div class="admin-auth-attention">
                <div class="admin-auth-attention-row">
                  <span>pending key applications</span>
                  <span class="is-amber">4</span>
                </div>
                <div class="admin-auth-attention-row">
                  <span>unredeemed donated keys</span>
                  <span class="is-amber">7</span>
                </div>
                <div class="admin-auth-attention-row">
                  <span>games marked broken</span>
                  <span class="is-err">4</span>
                </div>
              </div>
              <div class="admin-auth-opening">
                <span class="admin-auth-spinner" aria-hidden="true" />
                Opening console…
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div class="admin-auth">
      <div class="admin-auth-card">
        <TypewriterText as="pre" class="admin-auth-glyph" text={GLYPH} typeMs={4} aria-label="ADMIN" />
        <div class="admin-auth-subhead">RESTRICTED · ACCESS CODE REQUIRED</div>

        <form onSubmit={handleSubmit}>
          <div class="admin-auth-caption">// enter access code</div>
          <div class="admin-auth-input-bar">
            <span class="admin-auth-prompt">&gt;</span>
            <input
              type="password"
              class="admin-auth-input"
              value={code}
              onInput={(e) => setCode((e.target as HTMLInputElement).value.slice(0, 12))}
              maxLength={12}
              autoComplete="off"
              autoFocus
            />
            <span class="admin-auth-counter">{code.length} / 12</span>
          </div>
          <button type="submit" class="admin-btn admin-btn-primary admin-auth-submit">
            AUTHENTICATE ⏎
          </button>
        </form>

        <div class="admin-auth-footer">
          Session lasts 4 hours, then re-auth.
          <br />
          Every attempt is logged with IP and user agent.
        </div>
      </div>
    </div>
  )
}
