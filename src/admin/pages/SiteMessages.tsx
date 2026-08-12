import { useState } from 'preact/hooks'
import { SHOW_ON_PAGES, messageDraft, messageHistory } from '../data/messages'
import '../styles/messages.css'

const LEVELS = ['INFO', 'WARNING', 'CRITICAL'] as const

export function SiteMessages() {
  const [level, setLevel] = useState<(typeof LEVELS)[number]>(messageDraft.level)
  const [message, setMessage] = useState(messageDraft.message)
  const [linkLabel, setLinkLabel] = useState(messageDraft.linkLabel)
  const [linkTarget, setLinkTarget] = useState(messageDraft.linkTarget)
  const [showOn, setShowOn] = useState<(typeof SHOW_ON_PAGES)[number]>(messageDraft.showOn)
  const [expires, setExpires] = useState(messageDraft.expires)
  const [dismissible, setDismissible] = useState(messageDraft.dismissible)

  const bannerClass = level === 'INFO' ? 'admin-preview-banner is-info' : level === 'CRITICAL' ? 'admin-preview-banner is-critical' : 'admin-preview-banner'
  const bannerIcon = level === 'CRITICAL' ? '■' : '▲'

  return (
    <div>
      <h2>Site messages</h2>
      <p style={{ fontSize: '12px', color: 'rgba(var(--fg-rgb),.7)', marginBottom: '20px', maxWidth: '560px', lineHeight: 1.7 }}>
        A banner shown under the header on every public page. The quota banner is generated automatically and is
        separate from these.
      </p>

      <div class="admin-msg-layout">
        <div class="admin-msg-form">
          <div class="admin-msg-field">
            <div class="admin-msg-label">LEVEL</div>
            <div class="admin-msg-level-row">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  class={l === level ? `admin-msg-level-opt is-selected is-${l.toLowerCase()}` : 'admin-msg-level-opt'}
                  onClick={() => setLevel(l)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div class="admin-msg-field">
            <div class="admin-msg-label">
              <span>MESSAGE</span>
              <span>{message.length} / 200</span>
            </div>
            <textarea
              class="admin-msg-textarea"
              maxLength={200}
              value={message}
              onInput={(e) => setMessage((e.target as HTMLTextAreaElement).value)}
            />
          </div>

          <div class="admin-msg-field">
            <div class="admin-msg-label">LINK LABEL · OPTIONAL</div>
            <input class="admin-msg-input" value={linkLabel} onInput={(e) => setLinkLabel((e.target as HTMLInputElement).value)} />
          </div>
          <div class="admin-msg-field">
            <div class="admin-msg-label">LINK TARGET</div>
            <input class="admin-msg-input" value={linkTarget} onInput={(e) => setLinkTarget((e.target as HTMLInputElement).value)} />
          </div>

          <div class="admin-msg-field">
            <div class="admin-msg-label">SHOW ON</div>
            <div class="admin-msg-chips">
              {SHOW_ON_PAGES.map((p) => (
                <button
                  key={p}
                  type="button"
                  class={p === showOn ? 'admin-msg-chip is-selected' : 'admin-msg-chip'}
                  onClick={() => setShowOn(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div class="admin-msg-field">
            <div class="admin-msg-label">EXPIRES</div>
            <input class="admin-msg-input" value={expires} onInput={(e) => setExpires((e.target as HTMLInputElement).value)} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', cursor: 'pointer' }}>
            <span aria-hidden="true">{dismissible ? '[×]' : '[ ]'}</span>
            <input type="checkbox" checked={dismissible} onChange={() => setDismissible((v) => !v)} style={{ display: 'none' }} />
            DISMISSIBLE — yes, per session
          </label>

          <div class="admin-msg-actions">
            <button type="button" class="admin-btn admin-btn-primary">
              PUBLISH
            </button>
            <button type="button" class="admin-btn admin-btn-outline">
              SAVE DRAFT
            </button>
            <div class="admin-msg-actions-note">
              Live within 10 seconds.
              <br />
              Publishing writes to the audit log.
            </div>
          </div>
        </div>

        <div class="admin-msg-preview-col">
          <div class="admin-panel-head">PREVIEW</div>
          <div class="admin-preview-frame">
            <div class="admin-preview-header">
              <span class="admin-preview-brand">WORKSHOP.DL</span>
              <span class="admin-preview-nav">ABOUT · API · STATUS</span>
            </div>
            <div class={bannerClass}>
              <span class="sev-icon">{bannerIcon}</span>
              <span class="admin-preview-banner-text">{message}</span>
              {linkLabel && <span class="admin-preview-banner-link">{linkLabel.toUpperCase()}</span>}
              <span aria-hidden="true">✕</span>
            </div>
            <div class="admin-preview-body">
              <div class="admin-preview-body-heading">FETCH ANY ITEM</div>
              <div class="admin-preview-body-input">&gt; workshop URL or item id</div>
            </div>
          </div>

          <div class="admin-panel-head" style={{ marginTop: '20px' }}>
            HISTORY
          </div>
          <div class="admin-history-list">
            {messageHistory.map((h) => (
              <div class={h.live ? 'admin-history-row is-live' : 'admin-history-row'} key={h.title}>
                <span class={h.live ? 'sev-icon is-warn' : 'sev-icon is-info'}>{h.live ? '▲' : '·'}</span>
                <div>
                  <div class="admin-history-title">{h.title}</div>
                  <div class="admin-history-sub">{h.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
