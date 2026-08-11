import { getQuotaLevel, quotaResetAt } from '../data/quota'
import { useCountdown } from './useCountdown'
import { formatCountdown } from '../lib/format'

/** Whether downloads are currently blocked by the (mock) daily Steam quota,
 * and the live countdown to reset. Lookups/metadata are never gated by
 * this, only the download/queue actions. */
export function useQuotaGate() {
  const remaining = useCountdown(quotaResetAt)
  const isExhausted = getQuotaLevel() === 'exhausted'
  return { isExhausted, resetLabel: formatCountdown(remaining) }
}
