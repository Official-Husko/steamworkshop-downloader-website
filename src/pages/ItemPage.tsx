import { useEffect, useState } from 'preact/hooks'
import type { Resolved } from '../data/items'
import { Link } from '../router'
import { ItemDetailView } from '../components/ItemDetailView'
import { CollectionView } from '../components/CollectionView'
import { ItemErrorView } from '../components/ItemErrorView'
import { TypewriterText } from '../components/TypewriterText'
import '../styles/item-detail.css'

type FetchState = { status: 'loading' } | { status: 'error' } | { status: 'done'; resolved: Resolved }

export function ItemPage({ id }: { id: string }) {
  const [state, setState] = useState<FetchState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })

    fetch(`/api/v1/items/${encodeURIComponent(id)}`)
      .then(async (res) => {
        // A malformed id (400) has no meaningful distinction from
        // not-found here — the lookup form already validates format
        // before it ever gets this far, so a 400 only happens via a
        // hand-typed URL, and "no such item" is the honest answer either
        // way. 429/502/504 are transient upstream trouble, not a domain
        // "not-found" — thrown below to land in the shared error state.
        if (res.status === 400 || res.status === 404) {
          return { kind: 'not-found', id } satisfies Resolved
        }
        if (!res.ok) throw new Error(`resolve failed: ${res.status}`)
        return (await res.json()) as Resolved
      })
      .then((resolved) => {
        if (!cancelled) setState({ status: 'done', resolved })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [id])

  if (state.status === 'loading') {
    return (
      <ItemStatusView
        id={id}
        box="ok-box"
        heading="RESOLVING"
        body={`Looking up ${id} on the workshop.`}
      />
    )
  }

  if (state.status === 'error') {
    return (
      <ItemStatusView
        id={id}
        box="error-box"
        heading="LOOKUP FAILED"
        body="Could not reach the resolver right now. Try again shortly."
      />
    )
  }

  const resolved = state.resolved
  switch (resolved.kind) {
    case 'item':
      return <ItemDetailView item={resolved.item} />
    case 'collection':
      return <CollectionView collection={resolved.collection} />
    case 'removed':
    case 'private':
      return <ItemErrorView id={resolved.id} kind={resolved.kind} title={resolved.title} />
    case 'not-found':
      return <ItemErrorView id={resolved.id} kind="not-found" />
  }
}

function ItemStatusView({ id, box, heading, body }: { id: string; box: 'ok-box' | 'error-box'; heading: string; body: string }) {
  return (
    <div class="item-detail">
      <div class="page item-topbar">
        <Link href="/" class="back-link" aria-label="Back to lookup">
          ←
        </Link>
        <span class="item-topbar-id">{id}</span>
      </div>
      <div class="page-narrow item-error-wrap">
        <div class={box}>
          <TypewriterText as="div" class="box-title" text={heading} />
          <div class="box-body">{body}</div>
        </div>
      </div>
    </div>
  )
}
