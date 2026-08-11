import { useEffect, useMemo, useState } from 'preact/hooks'
import { Link } from '../router'
import type { CollectionChild, WorkshopCollection } from '../data/items'
import { formatBytes } from '../lib/format'
import { useRecentLookups } from '../hooks/useRecentLookups'
import { useSEO } from '../hooks/useSEO'
import { DownloadModal } from './DownloadModal'
import '../styles/collection.css'

type SortKey = 'workshop' | 'name' | 'size'

export function CollectionView({ collection }: { collection: WorkshopCollection }) {
  useSEO({
    title: collection.title,
    description: `Browse and download "${collection.title}", a Steam Workshop collection with ${collection.numChildren} items, via MODRELAY.`,
    path: `/items/${collection.id}`,
  })

  const { push } = useRecentLookups()
  const resolvableIds = useMemo(() => collection.children.filter((c) => c.status === 'ok').map((c) => c.id), [collection])
  const [selected, setSelected] = useState<Set<string>>(() => new Set(resolvableIds))
  const [expanded, setExpanded] = useState(false)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [sort, setSort] = useState<SortKey>('workshop')

  useEffect(() => {
    push({ id: collection.id, title: collection.title, sub: `${collection.numChildren} items` })
    setSelected(new Set(resolvableIds))
    setExpanded(false)
  }, [collection.id, collection.title, collection.numChildren, push, resolvableIds])

  const visibleChildren = expanded ? collection.children : collection.children.slice(0, 7)
  const hiddenCount = collection.children.length - visibleChildren.length
  const unresolvableCount = collection.children.filter((c) => c.status !== 'ok').length

  const sortedVisible = useMemo(() => {
    const arr = [...visibleChildren]
    if (sort === 'name') arr.sort((a, b) => a.title.localeCompare(b.title))
    if (sort === 'size') arr.sort((a, b) => (b.sizeBytes ?? 0) - (a.sizeBytes ?? 0))
    return arr
  }, [visibleChildren, sort])

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }
  function selectAll() {
    setSelected(new Set(resolvableIds))
  }
  function selectNone() {
    setSelected(new Set())
  }
  function invert() {
    setSelected(new Set(resolvableIds.filter((id) => !selected.has(id))))
  }

  const totalBytes = collection.children.reduce((sum, c) => (selected.has(c.id) ? sum + (c.sizeBytes ?? 0) : sum), 0)
  const shortLabel = collection.title.replace(/ Collection$/, '')

  return (
    <div class="collection">
      <div class="page collection-head">
        <div>
          <div class="collection-kicker">
            COLLECTION · {collection.id} · m_unNumChildren {collection.numChildren}
          </div>
          <h1 class="collection-title">{collection.title}</h1>
          <div class="collection-byline">
            by {collection.owner} · {collection.game.toUpperCase()} · updated {collection.updatedAt}
          </div>
        </div>
        <div class="collection-cta">
          <div class="collection-count">
            {selected.size} of {resolvableIds.length} selected · {formatBytes(totalBytes)}
          </div>
          <button type="button" class="btn btn-primary" disabled={selected.size === 0} onClick={() => setDownloadOpen(true)}>
            DOWNLOAD SELECTED (.zip)
          </button>
        </div>
      </div>

      <div class="page collection-toolbar">
        <button type="button" class="toolbar-btn" onClick={selectAll}>
          [A] select all
        </button>
        <button type="button" class="toolbar-btn" onClick={selectNone}>
          [N] select none
        </button>
        <button type="button" class="toolbar-btn" onClick={invert}>
          [X] invert
        </button>
        <div class="toolbar-sort">
          sort:
          <select value={sort} onChange={(e) => setSort((e.target as HTMLSelectElement).value as SortKey)}>
            <option value="workshop">workshop order</option>
            <option value="name">name</option>
            <option value="size">size</option>
          </select>
        </div>
      </div>

      <div class="page collection-tree">
        <div class="tree-root">
          └─ {collection.id} · {shortLabel}
        </div>
        {sortedVisible.map((child, i) => (
          <CollectionRow
            key={child.id}
            child={child}
            index={i}
            checked={selected.has(child.id)}
            onToggle={() => toggle(child.id)}
            isLast={i === sortedVisible.length - 1 && !hiddenCount}
          />
        ))}
        {hiddenCount > 0 && (
          <button type="button" class="tree-expand" onClick={() => setExpanded(true)}>
            └─ {hiddenCount} more items · <span class="accent-inline">expand</span>
          </button>
        )}
      </div>

      <div class="page collection-note">
        {unresolvableCount > 0
          ? `${unresolvableCount} ${unresolvableCount === 1 ? 'child' : 'children'} could not be resolved and ${
              unresolvableCount === 1 ? 'is' : 'are'
            } excluded from the archive. Removed and private items stay listed so the count still matches the collection on Steam.`
          : 'All children resolved successfully.'}
      </div>

      {downloadOpen && (
        <DownloadModal id={collection.id} title={collection.title} sizeBytes={totalBytes} archive onClose={() => setDownloadOpen(false)} />
      )}
    </div>
  )
}

function CollectionRow({
  child,
  index,
  checked,
  onToggle,
  isLast,
}: {
  child: CollectionChild
  index: number
  checked: boolean
  onToggle: () => void
  isLast: boolean
}) {
  const disabled = child.status !== 'ok'
  return (
    <div
      class={`tree-row${disabled ? ' is-disabled' : ''}${checked ? ' is-checked' : ''}`}
      style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}
    >
      <span class="tree-branch">{isLast ? '└─' : '├─'}</span>
      <button type="button" class="tree-check" disabled={disabled} onClick={onToggle} aria-pressed={checked}>
        {checked ? '[×]' : '[ ]'}
      </button>
      <Link href={`/items/${child.id}`} class="tree-id">
        {child.id}
      </Link>
      <span class="tree-title">
        {disabled ? <s>{child.title}</s> : child.title}
        {child.dependsOn && <span class="tree-dep"> · depends on {child.dependsOn}</span>}
      </span>
      {child.status === 'ok' && <span class="tree-size">{formatBytes(child.sizeBytes ?? 0)}</span>}
      {child.status === 'removed' && <span class="tree-badge is-err">REMOVED · m_eResult 9</span>}
      {child.status === 'private' && <span class="tree-badge is-warn">PRIVATE · m_eVisibility 2</span>}
    </div>
  )
}
