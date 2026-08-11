import { resolveId } from '../data/items'
import { ItemDetailView } from '../components/ItemDetailView'
import { CollectionView } from '../components/CollectionView'
import { ItemErrorView } from '../components/ItemErrorView'

export function ItemPage({ id }: { id: string }) {
  const resolved = resolveId(id)

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
