import { useMemo } from 'preact/hooks'
import { useCountdown } from '../hooks/useCountdown'
import { useSEO } from '../hooks/useSEO'
import { formatCountdown } from '../lib/format'
import '../styles/service-state.css'

export function Maintenance() {
  useSEO({
    title: 'Scheduled Maintenance',
    description: 'MODRELAY is briefly offline for scheduled maintenance.',
    path: '/maintenance',
    noindex: true,
  })

  const target = useMemo(() => Date.now() + 18 * 60_000 + 42_000, [])
  const remaining = useCountdown(target)

  return (
    <div class="service-state">
      <div class="service-state-inner">
        <div class="service-state-eyebrow">SCHEDULED MAINTENANCE</div>
        <h1 class="service-state-heading">Back shortly</h1>
        <p class="service-state-body">
          Migrating the cache to a bigger disk. Nothing is lost, queued downloads resume on their own when the
          service returns.
        </p>

        <div class="service-countdown-box">
          <div>
            <div class="service-countdown-value">{formatCountdown(remaining)}</div>
            <div class="service-countdown-caption">ESTIMATED · BACK AT 02:40 UTC</div>
          </div>
          <div class="service-countdown-note">
            This page refreshes itself.
            <br />
            No need to reload.
          </div>
        </div>

        <div class="service-state-footer">
          Status updates are posted on the status page, which stays up. This website is a community project and is
          not affiliated with Valve Corporation or Steam.
        </div>
      </div>
    </div>
  )
}
