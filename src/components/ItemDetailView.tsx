import { useEffect, useMemo, useState } from 'preact/hooks'
import { Link } from '../router'
import type { WorkshopItem } from '../data/items'
import { items as itemsById } from '../data/items'
import { formatBytes, formatCount, formatDateHuman } from '../lib/format'
import { useRecentLookups } from '../hooks/useRecentLookups'
import { useSEO } from '../hooks/useSEO'
import { useQuotaGate } from '../hooks/useQuotaGate'
import { useDownloadQueue } from '../hooks/useDownloadQueue'
import { renderBBCode, bbcodeToPlainText } from '../lib/bbcode'
import { DownloadModal } from './DownloadModal'
import { TypewriterText } from './TypewriterText'
import '../styles/item-detail.css'

type Tab = 'description' | 'changelog' | 'dependencies'

export function ItemDetailView({ item }: { item: WorkshopItem }) {
  useSEO({
    title: item.title,
    description: `Download "${item.title}" (${formatBytes(item.sizeBytes)}) from Steam Workshop via MODRELAY. ${bbcodeToPlainText(item.descriptionIntro)}`.slice(
      0,
      200,
    ),
    path: `/items/${item.id}`,
  })

  const { push } = useRecentLookups()
  const { isExhausted, resetLabel } = useQuotaGate()
  const { enqueue, isQueued } = useDownloadQueue()
  const [tab, setTab] = useState<Tab>('description')
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [jsonOpen, setJsonOpen] = useState(false)
  const [showApiNames, setShowApiNames] = useState(false)
  const queued = isQueued(item.id)

  useEffect(() => {
    push({ id: item.id, title: item.title, sub: formatBytes(item.sizeBytes) })
    setTab('description')
    setJsonOpen(false)
  }, [item.id, push])

  const rating = ((item.votesUp / Math.max(1, item.votesUp + item.votesDown)) * 100).toFixed(1)

  function copyLink() {
    const url = `${window.location.origin}/items/${item.id}`
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1600)
      })
      .catch(() => {})
  }

  return (
    <div class="item-detail">
      <div class="page item-topbar">
        <Link href="/" class="back-link" aria-label="Back to lookup">
          ←
        </Link>
        <span class="item-topbar-id">{item.id}</span>
        <span class="item-topbar-resolved">RESOLVED {item.resolveMs}ms</span>
      </div>

      <div class="page item-body">
        <aside class="item-side">
          <div class="item-preview">
            {item.previewUrl ? (
              <>
                <img src={item.previewUrl} alt={item.title} class="item-preview-img" />
                {showApiNames && <span class="item-preview-label">m_hPreviewFile</span>}
              </>
            ) : (
              <>{showApiNames ? 'm_hPreviewFile' : 'preview image'} · 636×358</>
            )}
          </div>

          <div class="item-fields-head">
            <span>DETAILS</span>
            <button
              type="button"
              class="item-api-toggle"
              aria-pressed={showApiNames}
              onClick={() => setShowApiNames((v) => !v)}
            >
              {showApiNames ? '[×]' : '[ ]'} show API names
            </button>
          </div>

          <dl class="item-fields">
            {showApiNames ? (
              <>
                <Field label="m_nPublishedFileId" value={item.id} />
                <Field label="m_eFileType" value={item.fileType} />
                <Field label="m_nConsumerAppID" value={item.appId} />
                <Field label="m_nFileSize" value={formatBytes(item.sizeBytes)} />
                <Field label="m_rtimeCreated" value={item.createdAt} />
                <Field label="m_rtimeUpdated" value={item.updatedAt} />
                <Field label="m_unVotesUp" value={formatCount(item.votesUp)} />
                <Field label="m_unVotesDown" value={formatCount(item.votesDown)} />
                <Field label="m_unNumChildren" value={String(item.numChildren)} />
                <Field label="m_eVisibility" value={item.visibility} accent />
                <Field label="m_bBanned" value={String(item.banned)} accent={!item.banned} />
              </>
            ) : (
              <>
                <Field label="Item ID" value={item.id} />
                <Field label="Type" value={item.numChildren > 0 ? 'Collection' : 'Single item'} />
                <Field label="Game" value={item.game} />
                <Field label="Download size" value={formatBytes(item.sizeBytes)} />
                <Field label="First published" value={formatDateHuman(item.createdAt)} />
                <Field label="Last updated" value={formatDateHuman(item.updatedAt)} />
                <Field label="Ratings" value={`${formatCount(item.votesUp)} up · ${formatCount(item.votesDown)} down`} />
                <Field
                  label="Items inside"
                  value={item.numChildren > 0 ? `${item.numChildren} items` : 'None (not a collection)'}
                />
                <Field label="Availability" value={item.visibility === 'PUBLIC' ? 'Public' : 'Private'} accent={item.visibility === 'PUBLIC'} />
                <Field label="Moderation" value={item.banned ? 'Removed' : 'Not removed'} accent={!item.banned} />
              </>
            )}
          </dl>

          <div class="item-side-footer">
            {showApiNames ? (
              <>
                subscriptions {formatCount(item.subscriptions)}
                <br />
                favorites {formatCount(item.favorites)}
                <br />
                lifetime views {formatCount(item.views)} · rating {rating}%
              </>
            ) : (
              <>
                Subscribers {formatCount(item.subscriptions)}
                <br />
                Favourites {formatCount(item.favorites)}
                <br />
                Lifetime views {formatCount(item.views)}
              </>
            )}
          </div>
        </aside>

        <div class="item-main">
          <div class="item-kicker">{showApiNames ? 'm_rgchTitle' : 'MOD'}</div>
          <TypewriterText as="h1" class="item-title" text={item.title} typeMs={28} />
          <div class="item-byline">
            {showApiNames ? (
              <>
                by <span class="accent-inline">m_ulSteamIDOwner</span> · {item.owner} · for {item.game.toUpperCase()}
              </>
            ) : (
              <>
                by <span class="accent-inline">{item.owner}</span> · for {item.game}
              </>
            )}
          </div>

          <div class="item-tags">
            {item.tags.map((t) => (
              <span class="tag" key={t}>
                {t}
              </span>
            ))}
          </div>

          {isExhausted ? (
            <div class="item-quota-block">
              <div class="item-quota-actions">
                <span class="btn btn-primary is-disabled">DOWNLOAD UNAVAILABLE</span>
                <button
                  type="button"
                  class="btn btn-outline is-queue"
                  disabled={queued}
                  onClick={() => enqueue(item.id)}
                >
                  {queued ? 'QUEUED ✓' : `QUEUE FOR ${resetLabel}`}
                </button>
              </div>
              <div class="item-quota-note">
                Queued items are held in your browser, not on the server. Closing the tab clears the queue.
              </div>
            </div>
          ) : null}

          <div class="item-actions">
            {!isExhausted && (
              <button type="button" class="btn btn-primary" onClick={() => setDownloadOpen(true)}>
                DOWNLOAD · {formatBytes(item.sizeBytes)}
              </button>
            )}
            <button type="button" class="btn btn-outline" onClick={copyLink}>
              {copied ? 'COPIED ✓' : 'COPY DIRECT LINK'}
            </button>
            <button type="button" class="btn btn-outline" onClick={() => setJsonOpen((v) => !v)}>
              RAW JSON
            </button>
            {isExhausted && <span class="item-quota-free-note">Metadata is served from cache and costs no quota.</span>}
          </div>

          {jsonOpen && <pre class="item-json">{JSON.stringify(item, null, 2)}</pre>}

          <div class="item-tabs-panel">
            <div class="item-tabs" role="tablist">
              <button type="button" class={tab === 'description' ? 'is-active' : ''} onClick={() => setTab('description')}>
                DESCRIPTION
              </button>
              <button type="button" class={tab === 'changelog' ? 'is-active' : ''} onClick={() => setTab('changelog')}>
                CHANGELOG ({item.changelogCount})
              </button>
              {item.dependencies && (
                <button type="button" class={tab === 'dependencies' ? 'is-active' : ''} onClick={() => setTab('dependencies')}>
                  DEPENDENCIES ({item.dependencies.length})
                </button>
              )}
            </div>
            <div class="item-tab-body">
              {tab === 'description' && <DescriptionTab item={item} />}
              {tab === 'changelog' && <ChangelogTab item={item} />}
              {tab === 'dependencies' && item.dependencies && <DependenciesTab ids={item.dependencies} />}
            </div>
          </div>

          {(item.requiresDlc || item.dependencies) && (
            <div class="item-warning">
              <span class="warn-icon">⚠</span>
              <span>
                {item.requiresDlc && <>Requires DLC: {item.requiresDlc}</>}
                {item.requiresDlc && item.dependencies && <> · </>}
                {item.dependencies && (
                  <>
                    Depends on {item.dependencies.length} other workshop item{item.dependencies.length > 1 ? 's' : ''},
                    listed under DEPENDENCIES.
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {downloadOpen && (
        <DownloadModal id={item.id} title={item.title} sizeBytes={item.sizeBytes} onClose={() => setDownloadOpen(false)} />
      )}
    </div>
  )
}

function Field({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div class="field-row">
      <span class="field-key">{label}</span>
      <span class={accent ? 'field-val is-accent' : 'field-val'}>{value}</span>
    </div>
  )
}

function DescriptionTab({ item }: { item: WorkshopItem }) {
  const [expanded, setExpanded] = useState(false)
  const hasBullets = item.descriptionBullets.length > 0
  return (
    <>
      <div class={expanded ? 'desc-clip is-expanded' : 'desc-clip'}>
        {item.descriptionHeading && <div class="desc-heading">{renderBBCode(item.descriptionHeading)}</div>}
        <div class="desc-body">{renderBBCode(item.descriptionIntro)}</div>
        {hasBullets && (
          <ul class="desc-list">
            {item.descriptionBullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
        {item.descriptionOutro && <div class="desc-outro">{renderBBCode(item.descriptionOutro)}</div>}
        <div class="desc-fade" aria-hidden="true" />
      </div>
      <button type="button" class="desc-expand-btn" onClick={() => setExpanded((v) => !v)}>
        {expanded ? 'show less' : 'show full description'}
      </button>
    </>
  )
}

function ChangelogTab({ item }: { item: WorkshopItem }) {
  const entries = useMemo(() => buildChangelog(item), [item])
  return (
    <div class="changelog-list">
      {entries.map((e) => (
        <div class="changelog-entry" key={e.version}>
          <span class="changelog-version">{e.version}</span>
          <span class="changelog-date">{e.date}</span>
          <div class="changelog-note">{e.note}</div>
        </div>
      ))}
    </div>
  )
}

function DependenciesTab({ ids }: { ids: string[] }) {
  return (
    <div class="deps-list">
      {ids.map((id) => {
        const dep = itemsById[id]
        if (!dep) return null
        return (
          <Link href={`/items/${id}`} class="dep-row" key={id}>
            <span class="dep-title">{dep.title}</span>
            <span class="dep-size">
              {id} · {formatBytes(dep.sizeBytes)}
            </span>
          </Link>
        )
      })}
    </div>
  )
}

const CHANGE_NOTES = [
  'Fixed a crash when the save contained more than 512 instances.',
  'Rebalanced throughput on the affected system.',
  'Updated localisation strings.',
  'Compatibility pass for the latest game patch.',
  'Minor performance improvements.',
  'Fixed an edge case reported by the community.',
  'Adjusted default settings based on feedback.',
  'Cleaned up unused assets to reduce download size.',
]

function buildChangelog(item: WorkshopItem) {
  const base = new Date(item.updatedAt).getTime()
  const count = Math.min(item.changelogCount, CHANGE_NOTES.length + 6)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base - i * 12 * 24 * 60 * 60 * 1000)
    const minor = count - i
    return {
      version: `v${Math.max(1, Math.floor(minor / 4) + 1)}.${minor % 4}`,
      date: d.toISOString().slice(0, 10),
      note: CHANGE_NOTES[i % CHANGE_NOTES.length],
    }
  })
}
