import { useEffect, useState } from 'preact/hooks'

/** Seconds remaining until `targetMs`, ticking once a second. Never negative. */
export function useCountdown(targetMs: number): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])

  return Math.max(0, Math.round((targetMs - now) / 1000))
}
