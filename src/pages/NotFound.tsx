import { Link } from '../router'
import '../styles/notfound.css'

const GLYPH = `  ██  ██  ████  ██  ██
  ██████ ██  ██ ██████
      ██ ██  ██     ██
      ██  ████      ██`

export function NotFound() {
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
