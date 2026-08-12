import { nameColor } from '../../lib/hue'
import { creditsFilterCounts, creditsRows, creditsMoreShownCount, creditsPreviewChips, addNameDraft } from '../data/credits'
import '../styles/keys.css'
import '../styles/credits-admin.css'

export function CreditsList() {
  return (
    <div>
      <div class="admin-page-head">
        <h2>Credits list</h2>
        <button type="button" class="admin-btn admin-btn-primary">
          + ADD NAME
        </button>
      </div>
      <p class="credits-admin-intro">
        Only donors who ticked the box appear. Hue is computed from the name and is not editable — rename to change
        it.
      </p>

      <div class="credits-admin-toolbar">
        <div class="credits-admin-search">
          <span class="prompt">&gt;</span>
          <span>search name, game or donation id</span>
        </div>
        <button type="button" class="admin-pill is-active">
          SHOWN {creditsFilterCounts.shown}
        </button>
        <button type="button" class="admin-pill">
          HIDDEN {creditsFilterCounts.hidden}
        </button>
        <button type="button" class="admin-pill is-amber">
          NEEDS REVIEW {creditsFilterCounts.needsReview}
        </button>
        <button type="button" class="admin-pill">
          ANONYMOUS {creditsFilterCounts.anonymous}
        </button>
        <span class="credits-admin-sort">SORT: DONATED ▾</span>
      </div>

      <div class="credits-admin-add">
        <div class="credits-admin-add-head">
          <span class="credits-admin-add-title">ADD A NAME MANUALLY</span>
          <span class="credits-admin-add-hint">for donations taken outside the form</span>
        </div>
        <div class="credits-admin-add-fields">
          <div style={{ flex: 1 }}>
            <div class="credits-admin-field-label">NAME</div>
            <div class="credits-admin-field-value is-name">
              <span class="credits-admin-dot" style={{ background: nameColor(addNameDraft.name) }} />
              <span style={{ color: nameColor(addNameDraft.name) }}>{addNameDraft.name}</span>
              <span class="cursor" aria-hidden="true" />
            </div>
          </div>
          <div style={{ width: '110px', flex: 'none' }}>
            <div class="credits-admin-field-label">HUE</div>
            <div class="credits-admin-field-value">168° auto</div>
          </div>
          <div style={{ width: '170px', flex: 'none' }}>
            <div class="credits-admin-field-label">LINK TO DONATION</div>
            <div class="credits-admin-field-value is-donation">{addNameDraft.linkedDonation} ▾</div>
          </div>
          <div style={{ width: '130px', flex: 'none' }}>
            <div class="credits-admin-field-label">GAME</div>
            <div class="credits-admin-field-value">{addNameDraft.game}</div>
          </div>
          <button type="button" class="admin-btn admin-btn-primary">
            ADD
          </button>
          <button type="button" class="admin-btn admin-btn-dim">
            CANCEL
          </button>
        </div>
        <div class="credits-admin-add-note">
          Unlinked names are allowed but marked as such in the list. Adding writes to the audit log with your
          session id.
        </div>
      </div>

      <div class="credits-admin-table">
        <div class="credits-admin-head">
          <span class="col-dot"></span>
          <span class="col-name">NAME</span>
          <span class="col-hue">HUE</span>
          <span class="col-game">GAME GIVEN</span>
          <span class="col-donated">DONATED</span>
          <span class="col-flag">FLAG</span>
          <span class="col-actions">ACTION</span>
        </div>
        {creditsRows.map((r) => {
          const color = nameColor(r.name)
          return (
            <div class="credits-admin-row" key={r.name}>
              <span class="col-dot">
                <span class="credits-admin-dot" style={{ background: color }} />
              </span>
              <span class="col-name" style={{ color }}>{r.name}</span>
              <span class="col-hue">{r.hue}°</span>
              <span class="col-game">{r.game}</span>
              <span class="col-donated">{r.date}</span>
              <span class="col-flag" style={r.flag ? { color: 'var(--warn)' } : undefined}>{r.flag ?? '—'}</span>
              <span class="col-actions">
                <button type="button" class="admin-btn admin-btn-dim">
                  RENAME
                </button>
                <button type="button" class="admin-btn admin-btn-dim">
                  {r.flag ? 'SHOW' : 'HIDE'}
                </button>
                <button type="button" class="admin-btn admin-btn-red">
                  REMOVE
                </button>
              </span>
            </div>
          )
        })}
        <div class="credits-admin-more-row">
          <span>{creditsMoreShownCount} more shown names</span>
          <span>load all</span>
        </div>
      </div>

      <div class="credits-admin-bottom">
        <div class="credits-admin-preview">
          <div class="admin-explain-title">PREVIEW · PUBLIC CREDITS PAGE</div>
          <div class="credits-admin-chips">
            {creditsPreviewChips.map((name) => {
              const color = nameColor(name)
              return (
                <div class="credits-admin-chip" key={name}>
                  <span class="credits-admin-chip-dot" style={{ background: color }} />
                  <span style={{ color }}>{name}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div class="admin-explain-box is-danger" style={{ width: '300px' }}>
          <div class="admin-explain-title is-danger">REMOVE</div>
          Deletes the stored name and drops the donation to anonymous. Used for removal requests and for names that
          should not be published. The redemption record stays.
        </div>
      </div>
    </div>
  )
}
