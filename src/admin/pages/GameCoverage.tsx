import { coverageTiles, coverageRows, coverageMoreCount, coverageExplain } from '../data/coverage'
import '../styles/keys.css'
import '../styles/coverage.css'

export function GameCoverage() {
  return (
    <div>
      <div class="admin-page-head">
        <h2>Game coverage</h2>
        <div class="coverage-toolbar">
          <span class="coverage-search">search game or app id</span>
          <button type="button" class="admin-pill is-active">
            + ADD GAME
          </button>
        </div>
      </div>

      <div class="coverage-tiles">
        {coverageTiles.map((t) => (
          <div class="coverage-tile" key={t.label}>
            <div class={t.tier === 'plain' ? 'admin-stat-value' : `admin-stat-value is-${t.tier}`}>{t.value}</div>
            <div class="admin-stat-label">{t.label}</div>
          </div>
        ))}
      </div>

      <div class="coverage-table">
        <div class="coverage-head">
          <span class="col-game">GAME</span>
          <span class="col-appid">APP ID</span>
          <span class="col-items">ITEMS</span>
          <span class="col-egress">EGRESS</span>
          <span class="col-fail">FAIL %</span>
          <span class="col-ownership">OWNERSHIP</span>
          <span class="col-extractor">EXTRACTOR</span>
          <span class="col-status">STATUS</span>
          <span class="col-actions">ACTION</span>
        </div>
        {coverageRows.map((r) => (
          <div class={r.status === 'broken' ? 'coverage-row is-err' : r.status === 'partial' ? 'coverage-row is-warn' : 'coverage-row'} key={r.appId}>
            <span class="col-game">{r.game}</span>
            <span class="col-appid">{r.appId}</span>
            <span class="col-items">{r.items}</span>
            <span class="col-egress">{r.egress}</span>
            <span class={`col-fail ${r.status === 'broken' ? 'is-err-cell' : r.status === 'partial' ? 'is-amber-cell' : 'is-ok-cell'}`}>{r.failPercent}</span>
            <span class="col-ownership">{r.ownership}</span>
            <span class="col-extractor">{r.extractor}</span>
            <span class={`col-status ${r.status === 'broken' ? 'is-err-cell' : r.status === 'partial' ? 'is-amber-cell' : 'is-ok-cell'}`}>■ {r.statusNote}</span>
            <span class="col-actions">
              {r.actions.map((act) => (
                <button key={act} type="button" class={act === 'SAMPLE' && r.status !== 'working' ? `admin-btn admin-btn-${r.status === 'broken' ? 'red' : 'amber'}` : 'admin-btn admin-btn-dim'}>
                  {act}
                </button>
              ))}
            </span>
          </div>
        ))}
        <div class="coverage-more-row">
          <span>{coverageMoreCount} more games</span>
          <span>load next 50</span>
        </div>
      </div>

      <div class="coverage-explain-row">
        <div class="admin-explain-box">
          <div class="admin-explain-title">TEST · SAMPLE</div>
          {coverageExplain.testSample}
        </div>
        <div class="admin-explain-box is-warn">
          <div class="admin-explain-title is-warn">STATUS IS PUBLIC</div>
          {coverageExplain.statusPublic}
        </div>
      </div>
    </div>
  )
}
