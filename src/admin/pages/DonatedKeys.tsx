import { useState } from 'preact/hooks'
import { donatedKeys, donatedKeysCounts, type DonatedKeyStatus } from '../data/keys'
import '../styles/keys.css'

const TABS: { key: 'unredeemed' | 'redeemed' | 'invalid' | 'all'; label: string; count: number }[] = [
  { key: 'unredeemed', label: 'UNREDEEMED', count: donatedKeysCounts.unredeemed },
  { key: 'redeemed', label: 'REDEEMED', count: donatedKeysCounts.redeemed },
  { key: 'invalid', label: 'INVALID', count: donatedKeysCounts.invalid },
  { key: 'all', label: 'ALL', count: donatedKeysCounts.all },
]

const SEV: Record<DonatedKeyStatus, { icon: string; class: string }> = {
  pending: { icon: '▲', class: 'is-warn' },
  'redeemed-credited': { icon: '·', class: 'is-info' },
  'redeemed-anon': { icon: '·', class: 'is-info' },
  invalid: { icon: '■', class: 'is-err' },
}

export function DonatedKeys() {
  const [tab, setTab] = useState<'unredeemed' | 'redeemed' | 'invalid' | 'all'>('unredeemed')
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())

  const visible = donatedKeys.filter((k) => {
    if (tab === 'all') return true
    if (tab === 'unredeemed') return k.status === 'pending'
    if (tab === 'redeemed') return k.status === 'redeemed-credited' || k.status === 'redeemed-anon'
    return k.status === 'invalid'
  })

  function reveal(id: string) {
    setRevealedIds((s) => new Set(s).add(id))
  }

  return (
    <div>
      <h2>Donated keys</h2>
      <div class="admin-tabs-row">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            class={t.key === tab ? 'admin-pill is-amber' : 'admin-pill'}
            onClick={() => setTab(t.key)}
          >
            {t.label} {t.count}
          </button>
        ))}
      </div>

      <table class="admin-table">
        <thead>
          <tr>
            <th class="admin-sev-cell"></th>
            <th>RECEIVED</th>
            <th>GAME</th>
            <th>KEY</th>
            <th>CREDITS NAME</th>
            <th>MESSAGE</th>
            <th class="col-actions">ACTION</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((k) => {
            const sev = SEV[k.status]
            const revealed = revealedIds.has(k.id)
            return (
              <tr key={k.id}>
                <td class="admin-sev-cell">
                  <span class={`sev-icon ${sev.class}`}>{sev.icon}</span>
                </td>
                <td>{k.received}</td>
                <td class={k.game ? '' : 'is-dim-cell'}>{k.game ?? '— not given'}</td>
                <td class="mono-masked">
                  {k.status === 'pending' ? (
                    revealed ? (
                      <span class="is-ok-cell">{k.keyMasked.replace(/•/g, 'X')}</span>
                    ) : (
                      k.keyMasked
                    )
                  ) : k.status === 'invalid' ? (
                    <span class="is-err-cell">{k.redeemedNote}</span>
                  ) : (
                    <span class="is-dim-cell">{k.redeemedNote}</span>
                  )}
                </td>
                <td class={k.creditsName ? 'is-ok-cell' : 'is-dim-cell'}>{k.creditsName ?? 'anonymous'}</td>
                <td class={k.message === 'no message' || k.message === '—' ? 'is-dim-cell' : ''}>{k.message}</td>
                <td class="col-actions">
                  {k.status === 'pending' && (
                    <>
                      <button type="button" class="admin-btn admin-btn-outline" onClick={() => reveal(k.id)}>
                        REVEAL
                      </button>
                      <button type="button" class="admin-btn admin-btn-primary">
                        REDEEM
                      </button>
                      <button type="button" class="admin-btn admin-btn-red">
                        VOID
                      </button>
                    </>
                  )}
                  {(k.status === 'redeemed-credited' || k.status === 'redeemed-anon') && (
                    <>
                      <button type="button" class="admin-btn admin-btn-dim">
                        AUDIT
                      </button>
                      <button type="button" class="admin-btn admin-btn-dim">
                        {k.status === 'redeemed-credited' ? 'CREDITS ✓' : 'NO CREDIT'}
                      </button>
                    </>
                  )}
                  {k.status === 'invalid' && (
                    <>
                      <button type="button" class="admin-btn admin-btn-outline">
                        MAIL DONOR
                      </button>
                      <button type="button" class="admin-btn admin-btn-dim">
                        ARCHIVE
                      </button>
                    </>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div class="admin-explain-row">
        <div class="admin-explain-box">
          <div class="admin-explain-title">REDEMPTION FLOW</div>
          Reveal shows the key once, in clear, for 30 seconds. Redeem marks it used and asks which app id it
          unlocked, which is what flips the game to covered on the public list and closes its request queue entry.
        </div>
        <div class="admin-explain-box is-danger">
          <div class="admin-explain-title is-danger">VOID</div>
          Discards the key without redeeming and deletes it from storage. Used for duplicates and anything that
          looks resold. Irreversible, and the donor is not told automatically.
        </div>
      </div>
    </div>
  )
}
