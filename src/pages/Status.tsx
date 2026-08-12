import { useState } from 'preact/hooks'
import {
  coverageTotals,
  gameCoverage,
  getQuotaLevel,
  globalStats,
  mostDownloaded,
  quotaResetAt,
  quotaStatus,
} from '../data/quota'
import { useCountdown } from '../hooks/useCountdown'
import { useSEO } from '../hooks/useSEO'
import { formatCompact, formatCount, formatCountdown, formatPercent, usageTier } from '../lib/format'
import { BarberBar } from '../components/BarberBar'
import { TypewriterText } from '../components/TypewriterText'
import '../styles/status.css'

const STATUS_LABEL: Record<string, { label: string; class: string }> = {
  normal: { label: 'ALL SYSTEMS OPERATIONAL', class: 'is-ok' },
  approaching: { label: 'APPROACHING DAILY LIMIT', class: 'is-warn' },
  exhausted: { label: 'DOWNLOADS PAUSED', class: 'is-err' },
  recovering: { label: 'RECOVERING', class: 'is-ok' },
}

export function Status() {
  useSEO({
    title: 'System Status',
    description: "MODRELAY's live daily budget usage, throughput totals, and per-game Workshop coverage.",
    path: '/status',
  })

  const level = getQuotaLevel()
  const remaining = useCountdown(quotaResetAt)
  const [expanded, setExpanded] = useState(false)
  const status = STATUS_LABEL[level]

  const filePct = formatPercent(quotaStatus.fileRequests.used, quotaStatus.fileRequests.limit)
  const detailPct = formatPercent(quotaStatus.detailRequests.used, quotaStatus.detailRequests.limit)
  const fileTier = usageTier(filePct)
  const detailTier = usageTier(detailPct)
  const visibleCoverage = expanded ? gameCoverage : gameCoverage.slice(0, 5)

  return (
    <div class="page status-page">
      <div class="status-head">
        <div>
          <TypewriterText as="div" class="doc-kicker" text="$ ./status --all" />
          <h1 class="doc-title" style={{ marginBottom: 0 }}>
            System status
          </h1>
        </div>
        <div class={`status-pill ${status.class}`}>
          <span class="status-dot" />
          <span>{status.label}</span>
        </div>
      </div>

      <div class="status-budget">
        <div class="status-budget-head">
          <span class="status-budget-title">DAILY BUDGET · ROLLING 24 H</span>
          <span class="status-budget-reset">RESETS IN {formatCountdown(remaining)}</span>
        </div>

        <div class="status-bar-row">
          <span>File requests</span>
          <span class="status-bar-value">
            <strong>{formatCount(quotaStatus.fileRequests.used)}</strong> of{' '}
            <strong>{formatCount(quotaStatus.fileRequests.limit)}</strong> allowed by Steam in 24 h
          </span>
        </div>
        <div class="status-bar">
          <BarberBar percent={filePct} tier={fileTier} durationS={1.4} />
        </div>
        <div class="status-bar-foot">
          <span>{formatCount(quotaStatus.fileRequests.limit - quotaStatus.fileRequests.used)} remaining</span>
          <span>
            peak hour {quotaStatus.peakHour} · {formatCount(quotaStatus.peakHourCount)}
          </span>
        </div>

        <div class="status-bar-row" style={{ marginTop: '18px' }}>
          <span>Public file detail requests</span>
          <span class="status-bar-value">
            <strong>{formatCount(quotaStatus.detailRequests.used)}</strong> of{' '}
            <strong>{formatCount(quotaStatus.detailRequests.limit)}</strong> in 24 h
          </span>
        </div>
        <div class="status-bar">
          <BarberBar percent={detailPct} tier={detailTier} durationS={1.4} />
        </div>
        <div class="status-bar-foot">
          <span class={detailPct >= 90 ? 'is-warn-text' : ''}>
            {formatCount(quotaStatus.detailRequests.limit - quotaStatus.detailRequests.used)} remaining
            {detailPct >= 90 ? ', metadata lookups are throttled above 90%' : ''}
          </span>
          <span>1 lookup serves 24 h of cache</span>
        </div>

        <div class="status-budget-note">
          Both ceilings are set by Steam per 24 hours, not by us. When one is exhausted, reads keep serving from
          cache and anything new queues until the window rolls.
        </div>
      </div>

      <div class="status-stats">
        <div class="status-stat">
          <div class="status-stat-value">{formatCompact(globalStats.fileRequestsSent)}</div>
          <div class="status-stat-label">FILE REQUESTS SENT</div>
        </div>
        <div class="status-stat">
          <div class="status-stat-value">{formatCompact(globalStats.filesDelivered)}</div>
          <div class="status-stat-label">FILES DELIVERED</div>
        </div>
        <div class="status-stat">
          <div class="status-stat-value">
            {globalStats.totalTransferredPB.toFixed(2)} <span class="status-stat-unit">PB</span>
          </div>
          <div class="status-stat-label">TOTAL TRANSFERRED</div>
        </div>
        <div class="status-stat">
          <div class="status-stat-value">
            {globalStats.medianResolveMs} <span class="status-stat-unit">ms</span>
          </div>
          <div class="status-stat-label">MEDIAN RESOLVE</div>
        </div>
      </div>

      <div class="status-highlights">
        <div class="status-highlight">
          <div class="status-highlight-heading">MOST DOWNLOADED GAME</div>
          <div class="status-highlight-name">{mostDownloaded.game.name}</div>
          <div class="status-highlight-sub">
            {formatCount(mostDownloaded.game.items)} items · {mostDownloaded.game.transferTB} TB ·{' '}
            {mostDownloaded.game.sharePercent}% of all traffic
          </div>
        </div>
        <div class="status-highlight">
          <div class="status-highlight-heading">MOST DOWNLOADED MOD</div>
          <div class="status-highlight-name">{mostDownloaded.mod.name}</div>
          <div class="status-highlight-sub">
            {mostDownloaded.mod.id} · {formatCount(mostDownloaded.mod.pulls)} pulls · {mostDownloaded.mod.transferTB}{' '}
            TB
          </div>
        </div>
      </div>

      <div class="status-coverage-head">
        <span class="status-coverage-title">GAME COVERAGE · {coverageTotals.totalGames} GAMES</span>
        <div class="status-coverage-legend">
          <span>
            <span class="legend-dot is-ok">■</span> WORKING {coverageTotals.working}
          </span>
          <span>
            <span class="legend-dot is-warn">■</span> PARTIAL {coverageTotals.partial}
          </span>
          <span>
            <span class="legend-dot is-err">■</span> BROKEN {coverageTotals.broken}
          </span>
        </div>
      </div>

      <div class="status-table">
        <div class="status-table-head">
          <span class="col-game">GAME</span>
          <span class="col-appid">APP ID</span>
          <span class="col-items">ITEMS</span>
          <span class="col-transfer">TRANSFER</span>
          <span class="col-workshop">WORKSHOP STATUS</span>
        </div>
        {visibleCoverage.map((g) => (
          <div class="status-table-row" key={g.appId}>
            <span class={`col-game${g.status === 'broken' ? ' is-muted' : ''}`}>{g.name}</span>
            <span class="col-appid">{g.appId}</span>
            <span class={`col-items${g.status === 'broken' ? ' is-muted' : ''}`}>{formatCount(g.items)}</span>
            <span class="col-transfer">{g.transferTB != null ? `${g.transferTB} TB` : 'n/a'}</span>
            <span class={`col-workshop is-${g.status}`}>
              ■ {g.status === 'working' ? 'Working' : g.status === 'partial' ? 'Partial' : 'Broken'}
              {g.statusNote ? `, ${g.statusNote}` : ''}
            </span>
          </div>
        ))}
        {!expanded && (
          <button type="button" class="status-table-more" onClick={() => setExpanded(true)}>
            {coverageTotals.moreCount} more games · <span class="accent-inline">view full list</span>
          </button>
        )}
      </div>
      <div class="status-coverage-note">
        Partial means the item downloads but we cannot unpack the game-specific container, so you receive it as-is.
        Broken means resolution currently fails; those entries are worked on in order of request count.
      </div>
    </div>
  )
}
