import { useState } from 'preact/hooks'
import {
  hourlyStacks,
  entryPoints,
  countries,
  countriesNote,
  pageBreakdown,
  heaviestAddresses,
  heaviestAddressesNote,
} from '../data/traffic'
import '../styles/overview.css'
import '../styles/keys.css'
import '../styles/traffic.css'

function BarList({ items }: { items: { label: string; count: string; percent: number; tier: 'ok' | 'dim' | 'faint' | 'warn' }[] }) {
  return (
    <>
      {items.map((it) => (
        <div class="traffic-bar-item" key={it.label}>
          <div class="traffic-bar-top">
            <span class="traffic-bar-label">{it.label}</span>
            <span class={it.tier === 'warn' ? 'traffic-bar-value is-warn' : 'traffic-bar-value'}>
              {it.count} · {it.percent}%
            </span>
          </div>
          <div class="traffic-bar-track">
            <div class={`traffic-bar-fill is-${it.tier}`} style={{ width: `${it.percent}%` }} />
          </div>
        </div>
      ))}
    </>
  )
}

export function Traffic() {
  const [range, setRange] = useState<'24h' | '7d' | '30d'>('24h')

  return (
    <div>
      <div class="admin-page-head">
        <h2>Traffic</h2>
        <div class="admin-range-tabs">
          {(['24h', '7d', '30d'] as const).map((r) => (
            <button key={r} type="button" class={r === range ? 'admin-range-tab is-active' : 'admin-range-tab'} onClick={() => setRange(r)}>
              {r === '24h' ? '24 H' : r === '7d' ? '7 D' : '30 D'}
            </button>
          ))}
          <button type="button" class="admin-range-tab">
            EXPORT CSV
          </button>
        </div>
      </div>

      <div class="admin-panel" style={{ marginBottom: '16px' }}>
        <div class="admin-panel-head">
          <span>REQUESTS PER HOUR</span>
          <div class="traffic-chart-legend">
            <span>
              <span class="sev-icon" style={{ color: 'var(--accent)' }}>■</span> LOOKUPS
            </span>
            <span>
              <span class="sev-icon" style={{ color: 'rgba(var(--accent-rgb),.45)' }}>■</span> DOWNLOADS
            </span>
            <span>
              <span class="sev-icon is-warn">■</span> UNKEYED SCRIPTS
            </span>
          </div>
        </div>
        <div class="traffic-stacked-chart">
          {hourlyStacks.map((h, i) => (
            <div class="traffic-stacked-bar" key={i}>
              <div class="traffic-stacked-seg" style={{ height: `${h.unkeyed}%`, background: 'var(--warn)' }} />
              <div class="traffic-stacked-seg" style={{ height: `${h.downloads}%`, background: 'rgba(var(--accent-rgb),.4)' }} />
              <div class="traffic-stacked-seg" style={{ height: `${h.lookups}%`, background: 'var(--accent)' }} />
            </div>
          ))}
        </div>
        <div class="admin-chart-axis">
          <span>00 UTC</span>
          <span>06</span>
          <span>12</span>
          <span>18</span>
          <span>23</span>
        </div>
      </div>

      <div class="traffic-breakdown-row">
        <div class="admin-panel">
          <div class="admin-panel-head">ENTRY POINT</div>
          <BarList items={entryPoints} />
        </div>
        <div class="admin-panel">
          <div class="admin-panel-head">COUNTRY</div>
          <BarList items={countries} />
          <div class="admin-overview-note">{countriesNote}</div>
        </div>
        <div class="admin-panel">
          <div class="admin-panel-head">PAGE</div>
          <BarList items={pageBreakdown.map((p) => ({ ...p, tier: 'ok' as const }))} />
        </div>
      </div>

      <div class="admin-panel-head">
        <span>HEAVIEST ADDRESSES · 24 H</span>
        <span style={{ color: 'var(--accent)' }}>REVEAL ALL · LOGGED</span>
      </div>
      <div class="traffic-addr-table">
        <div class="traffic-addr-head">
          <span class="col-ip">IP</span>
          <span class="col-geo">GEO</span>
          <span class="col-agent">AGENT</span>
          <span class="col-reqs">REQS</span>
          <span class="col-egress">EGRESS</span>
          <span class="col-note">NOTE</span>
          <span class="col-actions">ACTION</span>
        </div>
        {heaviestAddresses.map((a) => (
          <div class={a.severity === 'err' ? 'traffic-addr-row is-err' : 'traffic-addr-row'} key={a.ip}>
            <span class="col-ip">{a.ip}</span>
            <span class="col-geo">{a.geo}</span>
            <span class={a.agentFlagged ? 'col-agent is-amber' : 'col-agent'}>{a.agent}</span>
            <span class="col-reqs">{a.reqs}</span>
            <span class="col-egress">{a.egress}</span>
            <span class="col-note">{a.note}</span>
            <span class="col-actions">
              {a.actions.map((act) => (
                <button
                  key={act}
                  type="button"
                  class={act === 'THROTTLE' ? 'admin-btn admin-btn-amber' : act.startsWith('BLOCK') ? 'admin-btn admin-btn-red' : 'admin-btn admin-btn-dim'}
                >
                  {act}
                </button>
              ))}
            </span>
          </div>
        ))}
      </div>
      <div class="admin-note">{heaviestAddressesNote}</div>
    </div>
  )
}
