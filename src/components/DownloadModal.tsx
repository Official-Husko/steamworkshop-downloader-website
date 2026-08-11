import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { formatBytes, formatElapsed } from '../lib/format'
import { BarberBar } from './BarberBar'
import '../styles/modal.css'

interface LogLine {
  t: number
  text: string
  accent?: boolean
}

interface DownloadModalProps {
  id: string
  title: string
  sizeBytes: number
  archive?: boolean
  onClose: () => void
}

const CONNECT_MS = 900

export function DownloadModal({ id, title, sizeBytes, archive, onClose }: DownloadModalProps) {
  const [percent, setPercent] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [logs, setLogs] = useState<LogLine[]>([])
  const [phase, setPhase] = useState<'connecting' | 'transferring' | 'done'>('connecting')
  const [keepOpen, setKeepOpen] = useState(true)
  const panelRef = useRef<HTMLDivElement>(null)

  const handle = useMemo(() => Math.floor(1_000_000 + Math.random() * 8_999_999), [])
  const transferMs = useMemo(() => 6500 + Math.min(sizeBytes / (1024 * 1024), 400) * 14, [sizeBytes])

  useEffect(() => {
    panelRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const schedule: [number, string][] = [
      [0, 'resolving published file id…'],
      [340, `ok · ${title}`],
      [410, `requesting UGC handle ${handle}…`],
      [880, archive ? `building archive, ${formatBytes(sizeBytes)} expected` : `stream open, ${formatBytes(sizeBytes)} expected`],
    ]
    const timers = schedule.map(([ms, text]) =>
      window.setTimeout(() => setLogs((l) => [...l, { t: ms / 1000, text }]), ms),
    )
    return () => timers.forEach(window.clearTimeout)
  }, [archive, handle, sizeBytes, title])

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    let receivingLogged = false

    function tick(now: number) {
      const elapsed = now - start
      setElapsedMs(elapsed)
      if (elapsed < CONNECT_MS) {
        raf = requestAnimationFrame(tick)
        return
      }
      if (!receivingLogged) {
        receivingLogged = true
        setPhase('transferring')
        setLogs((l) => [...l, { t: elapsed / 1000, text: 'receiving' }])
      }
      const pct = Math.min(100, ((elapsed - CONNECT_MS) / transferMs) * 100)
      setPercent(pct)
      if (pct >= 100) {
        setPhase('done')
        setLogs((l) => [
          ...l,
          {
            t: elapsed / 1000,
            text: archive ? 'archive complete · sha1 verified' : 'done · sha1 verified',
            accent: true,
          },
        ])
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [archive, transferMs])

  const receivedBytes = (sizeBytes * percent) / 100
  const speedBps = elapsedMs > CONNECT_MS ? receivedBytes / ((elapsedMs - CONNECT_MS) / 1000) : 0
  const etaS = speedBps > 0 ? (sizeBytes - receivedBytes) / speedBps : 0

  return (
    <div class="modal-backdrop" onClick={onClose}>
      <div
        class="modal-panel"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Transfer ${id}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div class="modal-head">
          <span>TRANSFER {id}</span>
          <span>ELAPSED {formatElapsed(elapsedMs / 1000)}</span>
        </div>

        <div class="modal-log" aria-live="polite">
          {logs.map((line, i) => (
            <div key={i}>
              <span class={line.accent ? 'log-ts is-accent' : 'log-ts'}>[{line.t.toFixed(2).padStart(5, '0')}]</span>{' '}
              <span class={line.accent ? 'is-accent' : ''}>{line.text}</span>
              {line.text === 'receiving' && phase === 'transferring' && <span class="cursor log-cursor" aria-hidden="true" />}
            </div>
          ))}
        </div>

        <div class="modal-progress">
          <BarberBar percent={percent} durationS={0.9} done={phase === 'done'} />
          <span class="modal-progress-label">{Math.floor(percent)}%</span>
        </div>

        <div class="modal-stats">
          <span>
            {formatBytes(receivedBytes)} / {formatBytes(sizeBytes)}
          </span>
          <span>
            {phase === 'done' ? 'complete' : `${formatBytes(speedBps)}/s · eta ${formatElapsed(etaS)}`}
          </span>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-outline" onClick={onClose}>
            {phase === 'done' ? 'CLOSE' : 'ABORT'}
          </button>
          {phase !== 'done' && (
            <button
              type="button"
              class={keepOpen ? 'btn btn-ghost is-active' : 'btn btn-ghost'}
              aria-pressed={keepOpen}
              onClick={() => setKeepOpen((v) => !v)}
            >
              KEEP TAB OPEN
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
