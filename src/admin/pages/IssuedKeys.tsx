import { useState } from 'preact/hooks'
import { issuedKeys, issuedKeysCounts } from '../data/keys'
import '../styles/keys.css'

export function IssuedKeys() {
  const [tab, setTab] = useState<'active' | 'revoked'>('active')
  const [search, setSearch] = useState('')

  const visible = issuedKeys.filter((k) => {
    if (tab === 'active' && k.status === 'revoked') return false
    if (tab === 'revoked' && k.status !== 'revoked') return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return k.project.toLowerCase().includes(q) || k.keyPrefix.toLowerCase().includes(q)
  })

  return (
    <div>
      <h2>Issued keys</h2>

      <div class="admin-search-row">
        <div class="admin-tabs-row" style={{ marginBottom: 0 }}>
          <button type="button" class={tab === 'active' ? 'admin-pill is-active' : 'admin-pill'} onClick={() => setTab('active')}>
            ACTIVE
          </button>
          <button type="button" class={tab === 'revoked' ? 'admin-pill is-active' : 'admin-pill'} onClick={() => setTab('revoked')}>
            REVOKED
          </button>
        </div>
        <span style={{ color: 'rgba(var(--accent-rgb),.5)', fontSize: '11px' }}>
          {issuedKeysCounts.active} ACTIVE · {issuedKeysCounts.cap} CAP
        </span>
      </div>

      <input
        type="text"
        class="admin-search-input"
        placeholder="search project, key prefix or email"
        value={search}
        onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
        style={{ marginBottom: '14px' }}
      />

      <table class="admin-table">
        <thead>
          <tr>
            <th>PROJECT</th>
            <th>KEY</th>
            <th>READS TODAY</th>
            <th>DOWNLOADS</th>
            <th>CACHE HIT</th>
            <th>LAST SEEN</th>
            <th>FLAGS</th>
            <th class="col-actions">ACTION</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((k) => {
            const readsPct = k.readsToday != null && k.readsCap ? (k.readsToday / k.readsCap) * 100 : null
            const amber = readsPct != null && readsPct >= 90
            return (
              <tr key={k.id} class={k.status === 'revoked' ? 'is-dim' : k.status === 'flagged' ? 'is-amber' : ''}>
                <td>{k.project}</td>
                <td class="mono-masked">{k.keyPrefix}</td>
                <td>
                  {readsPct != null ? (
                    <>
                      <div class="admin-mini-bar-track">
                        <div class={amber ? 'admin-mini-bar-fill is-amber' : 'admin-mini-bar-fill'} style={{ width: `${Math.min(100, readsPct)}%` }} />
                      </div>
                      <span class={amber ? 'is-amber-cell' : ''}>
                        {k.readsToday}/{k.readsCap}
                      </span>
                    </>
                  ) : (
                    <span class="is-dim-cell">revoked {k.revokedDate}</span>
                  )}
                </td>
                <td>{k.downloads}</td>
                <td class={k.cacheHitPercent != null && k.cacheHitPercent < 60 ? 'is-amber-cell' : ''}>
                  {k.cacheHitPercent != null ? `${k.cacheHitPercent}%` : '—'}
                </td>
                <td>{k.lastSeen}</td>
                <td class={k.status === 'flagged' ? 'is-amber-cell' : k.status === 'revoked' ? 'is-err-cell' : 'is-dim-cell'}>
                  {k.flags ?? '—'}
                </td>
                <td class="col-actions">
                  {k.status === 'active' && (
                    <>
                      <button type="button" class="admin-btn admin-btn-dim">
                        ROTATE
                      </button>
                      <button type="button" class="admin-btn admin-btn-red">
                        REVOKE
                      </button>
                    </>
                  )}
                  {k.status === 'flagged' && (
                    <>
                      <button type="button" class="admin-btn admin-btn-amber">
                        THROTTLE
                      </button>
                      <button type="button" class="admin-btn admin-btn-red">
                        REVOKE
                      </button>
                    </>
                  )}
                  {k.status === 'revoked' && (
                    <button type="button" class="admin-btn admin-btn-dim">
                      AUDIT
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div class="admin-note">
        Throttle halves the caps until you lift it and mails the maintainer. Revoke is immediate and permanent; the
        key cannot be reissued to the same project without a fresh application.
      </div>
    </div>
  )
}
