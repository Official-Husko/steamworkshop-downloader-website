import { Link } from '../router'
import '../styles/item-detail.css'

interface ItemErrorViewProps {
  id: string
  kind: 'removed' | 'private' | 'not-found'
  title?: string
}

export function ItemErrorView({ id, kind, title }: ItemErrorViewProps) {
  const heading = kind === 'private' ? 'm_eVisibility 2 · PRIVATE' : 'm_eResult 9 · FILE NOT FOUND'
  const body =
    kind === 'private'
      ? `Item ${id}${title ? ` (${title})` : ''} is set to private by its author. It cannot be resolved from here.`
      : `Item ${id}${title ? ` (${title})` : ''} was removed by its author or by Steam. Nothing is retrievable — we keep no mirror.`

  return (
    <div class="item-detail">
      <div class="page item-topbar">
        <Link href="/" class="back-link" aria-label="Back to lookup">
          ←
        </Link>
        <span class="item-topbar-id">{id}</span>
      </div>
      <div class="page-narrow item-error-wrap">
        <div class="warn-box">
          <div class="box-title">{heading}</div>
          <div class="box-body">{body}</div>
        </div>
        <Link href="/" class="accent-link item-error-back">
          ← Return to lookup
        </Link>
      </div>
    </div>
  )
}
