import { Link, useRouter } from '../router'
import { useSEO } from '../hooks/useSEO'
import '../styles/notfound.css'

const GLYPH = `  ██  ██  ████  ██  ██
  ██████ ██  ██ ██████
      ██ ██  ██     ██
      ██  ████      ██`

export function NotFound() {
  const { path } = useRouter()
  useSEO({
    title: 'Page Not Found',
    description: 'This page does not exist on MODRELAY.',
    path,
    noindex: true,
  })

  return (
    <div class="notfound">
      <div class="notfound-inner">
        <pre class="notfound-glyph">{GLYPH}</pre>
        <div class="notfound-text">
          No page at this address.{' '}
          <Link href="/" class="accent-link">
            Return to lookup
          </Link>
        </div>
        <div class="notfound-code">404 · UNRESOLVED ROUTE</div>
      </div>
    </div>
  )
}
