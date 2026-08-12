import { useState } from 'preact/hooks'
import { logLines, logCounts, type LogCategory } from '../data/logs'
import '../styles/logs.css'

type Tab = 'ALL' | 'RESOLVE' | 'TRANSFER' | 'WARN' | 'ERROR' | 'AUDIT'

const TAB_TO_CATEGORY: Partial<Record<Tab, LogCategory>> = {
  RESOLVE: 'RESOLVE',
  TRANSFER: 'XFER',
  WARN: 'WARN',
  ERROR: 'ERROR',
  AUDIT: 'AUDIT',
}

const TABS: { key: Tab; count?: number }[] = [
  { key: 'ALL', count: logCounts.all },
  { key: 'RESOLVE' },
  { key: 'TRANSFER' },
  { key: 'WARN', count: logCounts.warn },
  { key: 'ERROR', count: logCounts.error },
  { key: 'AUDIT', count: logCounts.audit },
]

function rowClass(category: LogCategory): string {
  if (category === 'WARN') return 'admin-logs-row is-warn'
  if (category === 'ERROR') return 'admin-logs-row is-err'
  if (category === 'AUDIT') return 'admin-logs-row is-audit'
  return 'admin-logs-row'
}

export function Logs() {
  const [tab, setTab] = useState<Tab>('ALL')
  const [paused, setPaused] = useState(false)

  const visible = tab === 'ALL' ? logLines : logLines.filter((l) => l.category === TAB_TO_CATEGORY[tab])

  return (
    <div>
      <h2>Live logs</h2>

      <div class="admin-logs-toolbar">
        <input class="admin-logs-filter" placeholder="filter · level:error OR key:wdl_live_b104 · regex ok" readOnly />
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            class={t.key === tab ? 'admin-pill is-active' : 'admin-pill'}
            onClick={() => setTab(t.key)}
          >
            {t.key}
            {t.count != null ? ` ${t.count.toLocaleString('en-US')}` : ''}
          </button>
        ))}
        <button type="button" class="admin-btn admin-btn-dim" onClick={() => setPaused((v) => !v)}>
          {paused ? 'RESUME ▶' : 'PAUSE ⏸'}
        </button>
      </div>

      <div class="admin-logs-panel" aria-live="polite">
        {visible.map((l, i) => (
          <div class={rowClass(l.category)} key={i}>
            <span class="admin-logs-time">{l.time}</span>
            <span class="admin-logs-cat">{l.category}</span>
            <span class="admin-logs-actor">{l.actor}</span>
            <span class="admin-logs-msg">
              {l.message}
              {!paused && i === visible.length - 1 && <span class="cursor log-cursor" aria-hidden="true" />}
            </span>
          </div>
        ))}
      </div>

      <div class="admin-logs-footer">
        <div class="admin-note" style={{ marginTop: 0 }}>
          Retained 7 days, then dropped. IPs masked to /24 in storage; the last octet shown here is decrypted per
          session and never written.
        </div>
        <button type="button" class="admin-panel-action">
          EXPORT FILTERED · NDJSON
        </button>
      </div>
    </div>
  )
}
