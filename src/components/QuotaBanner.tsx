import { useEffect, useState } from 'preact/hooks'
import { Link } from '../router'
import { getQuotaLevel, quotaResetAt, quotaStatus, recoveringQueue } from '../data/quota'
import { useCountdown } from '../hooks/useCountdown'
import { formatCountdown, formatPercent } from '../lib/format'
import { BarberBar } from './BarberBar'
import '../styles/banner.css'

const DISMISS_KEY = 'wsdl:banner-dismissed'

export function QuotaBanner() {
  const level = getQuotaLevel()
  const remaining = useCountdown(quotaResetAt)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === level)
    } catch {
      setDismissed(false)
    }
  }, [level])

  if (level === 'normal') return null
  if (level !== 'exhausted' && dismissed) return null

  function dismiss() {
    setDismissed(true)
    try {
      sessionStorage.setItem(DISMISS_KEY, level)
    } catch {
      /* ignore */
    }
  }

  if (level === 'approaching') {
    const pct = formatPercent(quotaStatus.fileRequests.used, quotaStatus.fileRequests.limit)
    return (
      <div class="quota-banner is-approaching" role="status">
        <span class="quota-icon">▲</span>
        <div class="quota-text">
          Steam's daily file request limit is <strong>{pct.toFixed(0)}% used</strong>. Downloads may start queueing
          within the hour.
        </div>
        <span class="quota-meta">RESETS {formatCountdown(remaining)}</span>
        <Link href="/status" class="quota-action">
          STATUS
        </Link>
        <button type="button" class="quota-dismiss" onClick={dismiss} aria-label="Dismiss">
          ✕
        </button>
      </div>
    )
  }

  if (level === 'exhausted') {
    return (
      <div class="quota-banner is-exhausted" role="alert">
        <span class="quota-accent-bar" aria-hidden="true" />
        <span class="quota-icon">■</span>
        <div class="quota-text">
          <strong>Daily file request limit reached. Downloads are paused.</strong>
          <span class="quota-text-sub">
            Steam allows 100,000 file requests per 24 hours and all of them are spent. Lookups, item details and
            collections still work, so you can queue what you need now and it starts automatically when the window
            rolls.
          </span>
        </div>
        <div class="quota-countdown">
          <div class="quota-countdown-value">{formatCountdown(remaining)}</div>
          <div class="quota-countdown-label">UNTIL RESET</div>
        </div>
        <Link href="/status" class="quota-action">
          STATUS
        </Link>
      </div>
    )
  }

  return (
    <div class="quota-banner is-recovering" role="status">
      <span class="quota-icon">▸</span>
      <div class="quota-text">
        Limit reset. <strong>Downloads are running again.</strong> {recoveringQueue.count} queued transfers are
        draining, oldest first.
      </div>
      <div class="quota-progress">
        <BarberBar percent={recoveringQueue.drainPercent} durationS={1.4} />
      </div>
      <button type="button" class="quota-dismiss" onClick={dismiss}>
        DISMISS ✕
      </button>
    </div>
  )
}
