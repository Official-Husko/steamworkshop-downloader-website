import { useState } from 'preact/hooks'
import {
  pendingApplications,
  decidedApplications,
  modpackArchiverDetail as detail,
  apiApplicationsCounts,
} from '../data/keys'
import '../styles/keys.css'

const CHECK_ICON: Record<'ok' | 'warn' | 'info', string> = { ok: '✓', warn: '▲', info: '·' }

export function ApiApplications() {
  const [selected, setSelected] = useState(pendingApplications[0].id)
  const [mailKey, setMailKey] = useState(true)
  const [addToPublicList, setAddToPublicList] = useState(false)

  const current = pendingApplications.find((a) => a.id === selected) ?? pendingApplications[0]
  const showDetail = current.name === detail.name

  return (
    <div>
      <h2>API applications</h2>

      <div class="admin-apps-layout">
        <div class="admin-apps-queue">
          <div class="admin-apps-queue-head">
            <span>QUEUE · {apiApplicationsCounts.pending} PENDING</span>
            <span>OLDEST FIRST</span>
          </div>
          {pendingApplications.map((a) => (
            <div
              key={a.id}
              class={a.id === selected ? 'admin-apps-item is-selected' : 'admin-apps-item'}
              onClick={() => setSelected(a.id)}
            >
              <div class="admin-apps-item-top">
                <span>{a.name ?? '(no name given)'}</span>
                <span class={a.waitDays >= 8 ? 'admin-apps-item-wait is-amber' : 'admin-apps-item-wait'}>
                  {a.waitDays} d
                </span>
              </div>
              <div class={a.flagged ? 'admin-apps-item-stat is-err' : 'admin-apps-item-stat'}>{a.stat}</div>
            </div>
          ))}

          <div class="admin-apps-decided-head">DECIDED · LAST 30 D</div>
          {decidedApplications.map((d) => (
            <div class="admin-apps-decided-row" key={d.id}>
              <span>{d.name}</span>
              <span class={`admin-apps-decided-outcome ${d.ok ? 'is-ok' : 'is-err'}`}>{d.outcome}</span>
            </div>
          ))}
        </div>

        {showDetail ? (
          <>
            <div class="admin-apps-detail">
              <div class="admin-apps-detail-head">
                <div>
                  <div class="admin-apps-detail-title">{detail.name}</div>
                  <div class="admin-apps-detail-meta">
                    applied {detail.appliedDate} · waiting {detail.waitDays} days · from {detail.fromIpMasked}
                  </div>
                </div>
                <div class="admin-apps-detail-actions">
                  <button type="button" class="admin-btn admin-btn-primary">
                    ISSUE KEY
                  </button>
                  <button type="button" class="admin-btn admin-btn-amber">
                    ASK FOR MORE
                  </button>
                  <button type="button" class="admin-btn admin-btn-red">
                    REJECT
                  </button>
                </div>
              </div>

              <div class="admin-panel-head">WHAT IT DOES</div>
              <div class="admin-apps-panel">{detail.whatItDoes}</div>

              <div class="admin-apps-fields">
                <div>
                  <div class="admin-apps-field-label">contact</div>
                  <div class="admin-apps-field-value">{detail.contact}</div>
                </div>
                <div>
                  <div class="admin-apps-field-label">stated volume</div>
                  <div class="admin-apps-field-value">{detail.statedVolume}</div>
                </div>
                <div>
                  <div class="admin-apps-field-label">source</div>
                  <div class="admin-apps-field-value is-link">{detail.source}</div>
                </div>
                <div>
                  <div class="admin-apps-field-label">commercial</div>
                  <div class="admin-apps-field-value">{detail.commercial}</div>
                </div>
              </div>

              <div class="admin-panel-head">AUTOMATED CHECKS</div>
              <div class="admin-apps-checks">
                {detail.checks.map((c) => (
                  <div class={c.icon === 'info' ? 'admin-apps-check-row is-info' : 'admin-apps-check-row'} key={c.text}>
                    <span class={`sev-icon is-${c.icon === 'ok' ? 'ok' : c.icon}`}>{CHECK_ICON[c.icon]}</span>
                    <span>{c.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div class="admin-apps-side">
              <div class="admin-panel-head">ISSUE WITH</div>
              <div class="admin-issue-field">
                <div class="admin-issue-field-label">daily read cap</div>
                <input type="text" value={detail.issueDefaults.dailyReadCap} />
              </div>
              <div class="admin-issue-field">
                <div class="admin-issue-field-label">daily download cap</div>
                <input type="text" value={detail.issueDefaults.dailyDownloadCap} />
              </div>
              <div class="admin-issue-field">
                <div class="admin-issue-field-label">expires</div>
                <input type="text" value={detail.issueDefaults.expires} />
              </div>

              <label class="admin-issue-checkbox">
                <span aria-hidden="true">{mailKey ? '[×]' : '[ ]'}</span>
                <input type="checkbox" checked={mailKey} onChange={() => setMailKey((v) => !v)} style={{ display: 'none' }} />
                Mail the key to the contact address
              </label>
              <label class="admin-issue-checkbox">
                <span aria-hidden="true">{addToPublicList ? '[×]' : '[ ]'}</span>
                <input
                  type="checkbox"
                  checked={addToPublicList}
                  onChange={() => setAddToPublicList((v) => !v)}
                  style={{ display: 'none' }}
                />
                Add to the public API users list
              </label>

              <div class="admin-issue-note">
                Issuing generates <code>wdl_live_…</code> and shows it once. You cannot retrieve it later, only
                rotate.
              </div>
            </div>
          </>
        ) : (
          <div class="admin-apps-detail">
            <div class="admin-apps-detail-title">{current.name ?? '(no name given)'}</div>
            <div class="admin-apps-panel" style={{ marginTop: '12px' }}>
              This application wasn't part of the design mockup pass — only "Modpack Archiver" has a full detail
              view built. Select it from the queue to see the review flow.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
