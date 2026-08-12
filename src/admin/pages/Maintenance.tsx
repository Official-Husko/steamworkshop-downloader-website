import { useState } from 'preact/hooks'
import '../styles/maintenance.css'

const CONFIRM_WORD = 'MAINTENANCE'

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" class={on ? 'admin-toggle-switch is-on' : 'admin-toggle-switch'} onClick={onToggle} aria-pressed={on}>
      <span class="admin-toggle-thumb" />
    </button>
  )
}

export function Maintenance() {
  const [downloadsPaused, setDownloadsPaused] = useState(false)
  const [readOnly, setReadOnly] = useState(true)
  const [fullMaintenance, setFullMaintenance] = useState(false)
  const [reason, setReason] = useState('Migrating the cache to a bigger disk.')
  const [expectedBack, setExpectedBack] = useState('02:40 UTC')
  const [autoLift, setAutoLift] = useState(true)
  const [confirmText, setConfirmText] = useState('')

  const canEnable = confirmText === CONFIRM_WORD

  return (
    <div>
      <h2>Maintenance</h2>

      <div class={downloadsPaused ? 'admin-toggle-row is-on' : 'admin-toggle-row'}>
        <div>
          <div class="admin-toggle-label">Downloads paused</div>
          <div class="admin-toggle-desc">Lookups keep working. Shows the queue-for-later state.</div>
        </div>
        <div class="admin-toggle-switch-wrap">
          <span class="admin-toggle-state">{downloadsPaused ? 'ON' : 'OFF'}</span>
          <Toggle on={downloadsPaused} onToggle={() => setDownloadsPaused((v) => !v)} />
        </div>
      </div>

      <div class={readOnly ? 'admin-toggle-row is-on' : 'admin-toggle-row'}>
        <div>
          <div class="admin-toggle-label">Read-only mode</div>
          <div class="admin-toggle-desc">Cached lookups only. No new Steam calls, no forms.</div>
        </div>
        <div class="admin-toggle-switch-wrap">
          <span class="admin-toggle-state">{readOnly ? 'ON' : 'OFF'}</span>
          <Toggle on={readOnly} onToggle={() => setReadOnly((v) => !v)} />
        </div>
      </div>

      <div class={fullMaintenance ? 'admin-toggle-row is-on' : 'admin-toggle-row'}>
        <div>
          <div class="admin-toggle-label">Full maintenance</div>
          <div class="admin-toggle-desc">Every public page replaced by the maintenance screen. Admin stays reachable.</div>
        </div>
        <div class="admin-toggle-switch-wrap">
          <span class="admin-toggle-state">{fullMaintenance ? 'ON' : 'OFF'}</span>
          <Toggle on={fullMaintenance} onToggle={() => setFullMaintenance((v) => !v)} />
        </div>
      </div>

      <div class="admin-maint-fields">
        <div>
          <div class="admin-msg-label" style={{ marginBottom: '6px', fontSize: '10px', letterSpacing: '.06em', color: 'rgba(var(--accent-rgb),.45)' }}>
            REASON SHOWN TO VISITORS
          </div>
          <textarea class="admin-msg-textarea" value={reason} onInput={(e) => setReason((e.target as HTMLTextAreaElement).value)} />
        </div>
        <div style={{ maxWidth: '220px' }}>
          <div style={{ marginBottom: '6px', fontSize: '10px', letterSpacing: '.06em', color: 'rgba(var(--accent-rgb),.45)' }}>EXPECTED BACK</div>
          <input class="admin-msg-input" value={expectedBack} onInput={(e) => setExpectedBack((e.target as HTMLInputElement).value)} />
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', marginTop: '10px', cursor: 'pointer' }}>
            <span aria-hidden="true">{autoLift ? '[×]' : '[ ]'}</span>
            <input type="checkbox" checked={autoLift} onChange={() => setAutoLift((v) => !v)} style={{ display: 'none' }} />
            AUTO-LIFT — at that time
          </label>
        </div>
      </div>

      <div class="admin-danger-zone">
        <div class="admin-danger-warning">
          Turning on full maintenance drops 412 in-flight transfers. Type <strong>{CONFIRM_WORD}</strong> to confirm.
        </div>
        <div class="admin-confirm-row">
          <input
            class="admin-confirm-input"
            placeholder="type to confirm"
            value={confirmText}
            onInput={(e) => setConfirmText((e.target as HTMLInputElement).value)}
          />
          <button type="button" class="admin-btn admin-btn-red" disabled={!canEnable}>
            ENABLE
          </button>
        </div>
      </div>
    </div>
  )
}
