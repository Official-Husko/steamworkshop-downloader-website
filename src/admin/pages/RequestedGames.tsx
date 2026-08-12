import { useState } from 'preact/hooks'
import { Dropdown } from '../../components/Dropdown'
import { requestedGames, requestedGamesCounts, STATUS_OPTIONS, type GameStatus } from '../data/content'
import '../styles/keys.css'
import '../styles/content.css'

type FilterTab = 'open' | 'covered' | 'closed' | 'merged'

function pillClass(status: GameStatus): string {
  if (status === 'OPEN · NEEDS A KEY') return 'is-amber'
  if (status === 'COVERED · BROKEN') return 'is-err'
  if (status.startsWith('CLOSED')) return 'is-dim'
  return 'is-ok'
}

export function RequestedGames() {
  const [filter, setFilter] = useState<FilterTab>('open')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftStatus, setDraftStatus] = useState<GameStatus>('OPEN · NEEDS A KEY')
  const [draftNote, setDraftNote] = useState('')
  const [rows, setRows] = useState(requestedGames)

  const visible = rows.filter((r) => {
    if (filter === 'open') return r.status === 'OPEN · NEEDS A KEY'
    if (filter === 'covered') return r.status.startsWith('COVERED')
    if (filter === 'closed') return r.status.startsWith('CLOSED')
    return false
  })

  function startEdit(id: string) {
    const row = rows.find((r) => r.id === id)
    if (!row) return
    setEditingId(id)
    setDraftStatus(row.status)
    setDraftNote(row.publicNote)
  }

  function save() {
    setRows((rs) => rs.map((r) => (r.id === editingId ? { ...r, status: draftStatus, publicNote: draftNote, displayLabel: undefined } : r)))
    setEditingId(null)
  }

  return (
    <div>
      <div class="admin-page-head">
        <h2>Requested games</h2>
      </div>

      <div class="admin-tabs-row">
        <button type="button" class={filter === 'open' ? 'admin-pill is-active' : 'admin-pill'} onClick={() => setFilter('open')}>
          OPEN {requestedGamesCounts.open}
        </button>
        <button type="button" class={filter === 'covered' ? 'admin-pill is-active' : 'admin-pill'} onClick={() => setFilter('covered')}>
          COVERED {requestedGamesCounts.covered}
        </button>
        <button type="button" class={filter === 'closed' ? 'admin-pill is-active' : 'admin-pill'} onClick={() => setFilter('closed')}>
          CLOSED {requestedGamesCounts.closed}
        </button>
        <button type="button" class={filter === 'merged' ? 'admin-pill is-active' : 'admin-pill'} onClick={() => setFilter('merged')}>
          MERGED {requestedGamesCounts.merged}
        </button>
      </div>

      <table class="admin-table">
        <thead>
          <tr>
            <th class="num">REQS</th>
            <th>APP ID</th>
            <th>GAME</th>
            <th>STATUS</th>
            <th>PUBLIC NOTE</th>
            <th class="col-actions">ACTION</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => {
            const isEditing = editingId === r.id
            return (
              <tr key={r.id} class={isEditing ? 'is-editing' : r.closed ? 'is-row-closed' : ''}>
                <td class="num">{r.reqs}</td>
                <td>{r.appId}</td>
                <td>{r.game}</td>
                <td>
                  {isEditing ? (
                    <Dropdown
                      value={draftStatus}
                      onChange={(v) => setDraftStatus(v as GameStatus)}
                      ariaLabel={`Status for ${r.game}`}
                      options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
                    />
                  ) : (
                    <span class={`admin-status-pill ${pillClass(r.status)}`} onClick={() => startEdit(r.id)}>
                      {r.displayLabel ?? r.status} ▾
                    </span>
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <textarea class="admin-note-edit" value={draftNote} onInput={(e) => setDraftNote((e.target as HTMLTextAreaElement).value)} />
                  ) : (
                    <span class={r.status === 'COVERED · BROKEN' ? 'is-err-cell' : r.closed ? 'is-dim-cell' : ''}>{r.publicNote}</span>
                  )}
                </td>
                <td class="col-actions">
                  {isEditing ? (
                    <>
                      <button type="button" class="admin-btn admin-btn-primary" onClick={save}>
                        SAVE
                      </button>
                      <button type="button" class="admin-btn admin-btn-dim" onClick={() => setEditingId(null)}>
                        CANCEL
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" class="admin-btn admin-btn-dim" onClick={() => startEdit(r.id)}>
                        EDIT
                      </button>
                      <button type="button" class="admin-btn admin-btn-dim">
                        {r.closed ? 'REOPEN' : 'MERGE'}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div class="admin-note">
        Status and public note both appear on the request queue and the coverage table. Marking a game covered
        closes its queue entry and mails everyone who asked, if they left an address. Merge folds duplicate entries
        into one and adds their counts together.
      </div>
    </div>
  )
}
