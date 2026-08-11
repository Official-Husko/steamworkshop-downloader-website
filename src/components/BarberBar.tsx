import '../styles/barber.css'

export type BarberTier = 'ok' | 'warn' | 'err'

const COLORS: Record<BarberTier, { bright: string; dim: string }> = {
  ok: { bright: '#7ef0b0', dim: '#63cd95' },
  warn: { bright: '#ffcf6b', dim: '#dbaf58' },
  err: { bright: '#ff9b9b', dim: '#c97575' },
}

interface BarberBarProps {
  percent: number
  tier?: BarberTier
  durationS?: number
  /** Renders as a flat, unanimated fill once the underlying transfer is done. */
  done?: boolean
}

/** The two-layer diagonal-stripe progress fill used across the site (transfers,
 * quota bars): an outer solid-color div sized to `percent`, with an
 * oversized inner div carrying the diagonal stripe pattern that slides via
 * the shared `barber` keyframe (translateX, not background-position). */
export function BarberBar({ percent, tier = 'ok', durationS = 1.4, done = false }: BarberBarProps) {
  const c = COLORS[tier]
  return (
    <div class="barber-fill" style={{ width: `${percent}%`, background: done ? c.bright : c.dim }}>
      {!done && (
        <div
          class="barber-stripes"
          style={{
            backgroundImage: `repeating-linear-gradient(115deg, ${c.bright} 0 14px, ${c.dim} 14px 28px)`,
            animationDuration: `${durationS}s`,
          }}
        />
      )}
    </div>
  )
}
