import { useMemo } from 'preact/hooks'
import { Link } from '../router'
import { useCountdown } from '../hooks/useCountdown'
import { useSEO } from '../hooks/useSEO'
import { formatElapsed } from '../lib/format'
import '../styles/service-state.css'

export function ServiceUnavailable() {
  useSEO({
    title: 'Temporarily Unavailable',
    description: "Steam's API is not answering, so lookups cannot complete right now.",
    path: '/unavailable',
    noindex: true,
  })

  const target = useMemo(() => Date.now() + 24_000, [])
  const remaining = useCountdown(target)

  return (
    <div class="service-state">
      <div class="service-state-inner">
        <div class="service-state-eyebrow is-warn">503 · TEMPORARILY UNAVAILABLE</div>
        <h1 class="service-state-heading">Steam is not answering</h1>
        <p class="service-state-body">
          Upstream requests have been failing for the last few minutes, so lookups cannot complete. This is not a
          problem on your end and nobody needs to do anything.
        </p>

        <div class="service-meta-box">
          <div class="service-meta-row">
            <span>first failure</span>
            <span class="val">11:38:04 UTC</span>
          </div>
          <div class="service-meta-row">
            <span>consecutive failures</span>
            <span class="val">61</span>
          </div>
          <div class="service-meta-row">
            <span>next automatic retry</span>
            <span class="val is-warn">{formatElapsed(remaining)}</span>
          </div>
          <div class="service-meta-row">
            <span>cached items still served</span>
            <span class="val is-ok">yes</span>
          </div>
        </div>

        <div class="service-state-actions">
          <button type="button" class="btn btn-outline" onClick={() => window.location.reload()}>
            RETRY NOW
          </button>
          <Link href="/status" class="btn btn-ghost">
            STATUS PAGE
          </Link>
        </div>

        <div class="service-state-footer">
          Anything already in your recent list can still be opened from cache. This website is a community project
          and is not affiliated with Valve Corporation or Steam.
        </div>
      </div>
    </div>
  )
}
