import { useState } from 'preact/hooks'
import {
  statTiles,
  hourlyRequestBars,
  hourlyPeak,
  needsAttention,
  topUserAgents,
  lastVisitors,
  type Severity,
} from '../data/overview'
import '../styles/overview.css'

const SEV_ICON: Record<Severity, string> = { warn: '▲', err: '■', info: '·' }

export function Overview() {
  const [range, setRange] = useState<'24h' | '7d' | '30d'>('24h')
  const [revealed, setRevealed] = useState(false)

  return (
    <div>
      <div class="admin-page-head">
        <h2>Overview</h2>
        <div class="admin-range-tabs">
          {(['24h', '7d', '30d'] as const).map((r) => (
            <button
              key={r}
              type="button"
              class={r === range ? 'admin-range-tab is-active' : 'admin-range-tab'}
              onClick={() => setRange(r)}
            >
              {r === '24h' ? '24 H' : r === '7d' ? '7 D' : '30 D'}
            </button>
          ))}
        </div>
      </div>

      <div class="admin-stat-grid">
        {statTiles.map((t) => (
          <div class="admin-stat-tile" key={t.label}>
            <div class={`admin-stat-value${t.tier !== 'ok' ? ` is-${t.tier}` : ''}`}>
              {t.value}
              {t.unit && <span class="admin-stat-unit"> {t.unit}</span>}
            </div>
            <div class="admin-stat-label">{t.label}</div>
          </div>
        ))}
      </div>

      <div class="admin-row-2">
        <div class="admin-panel">
          <div class="admin-panel-head">
            <span>REQUESTS PER HOUR · 24 H</span>
            <span>PEAK {hourlyPeak}</span>
          </div>
          <div class="admin-chart">
            {hourlyRequestBars.map((h, i) => (
              <div
                key={i}
                class="admin-chart-bar"
                style={{
                  height: `${h}%`,
                  background: h >= 88 ? 'var(--accent)' : h >= 60 ? 'rgba(var(--accent-rgb),.6)' : h >= 40 ? 'rgba(var(--accent-rgb),.5)' : 'rgba(var(--accent-rgb),.35)',
                }}
              />
            ))}
          </div>
          <div class="admin-chart-axis">
            <span>00 UTC</span>
            <span>08</span>
            <span>16</span>
            <span>23</span>
          </div>
        </div>

        <div class="admin-panel is-narrow">
          <div class="admin-panel-head">
            <span>NEEDS ATTENTION</span>
          </div>
          <div class="admin-attn-list">
            {needsAttention.map((n) => (
              <div class={n.severity === 'info' ? 'admin-attn-row is-info' : 'admin-attn-row'} key={n.text}>
                <span class={`sev-icon is-${n.severity}`}>{SEV_ICON[n.severity]}</span>
                <span>{n.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div class="admin-row-2">
        <div class="admin-panel">
          <div class="admin-panel-head">
            <span>TOP USER AGENTS · 24 H</span>
          </div>
          {topUserAgents.map((a) => (
            <div class="admin-agent-row" key={a.agent}>
              <div class={a.flagged ? 'admin-agent-top is-amber' : 'admin-agent-top'}>
                <span>{a.agent}</span>
                <span>
                  {a.count} · {a.percent}%
                </span>
              </div>
              <div class="admin-agent-bar-track">
                <div
                  class={`admin-agent-bar-fill${a.flagged ? ' is-amber' : a.percent < 15 ? ' is-dim' : ''}`}
                  style={{ width: `${a.percent}%` }}
                />
              </div>
            </div>
          ))}
          <div class="admin-overview-note">Unkeyed script traffic is amber. 12% of requests, all rate limited.</div>
        </div>

        <div class="admin-panel">
          <div class="admin-panel-head">
            <span>LAST VISITORS</span>
            <button type="button" class="admin-panel-action" onClick={() => setRevealed((v) => !v)}>
              {revealed ? 'MASK ALL' : 'REVEAL ALL'}
            </button>
          </div>
          <table class="admin-visitor-table">
            <thead>
              <tr>
                <th>IP</th>
                <th>GEO</th>
                <th>AGENT</th>
                <th class="num">REQS</th>
                <th class="num">SEEN</th>
              </tr>
            </thead>
            <tbody>
              {lastVisitors.map((v) => (
                <tr class={v.flagged ? 'is-flagged' : ''} key={v.ip}>
                  <td class="mono-masked">{v.ip}.{revealed ? v.lastOctet : '•••'}</td>
                  <td class="col-geo">{v.geo}</td>
                  <td>{v.agent}</td>
                  <td class="num">{v.reqs.toLocaleString('en-US')}</td>
                  <td class="col-seen">{v.seen}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div class="admin-overview-note">Last octet masked. Revealing writes an entry to the audit log with your session id.</div>
        </div>
      </div>
    </div>
  )
}
