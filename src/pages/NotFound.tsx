import { Link, useRouter } from '../router'
import { useSEO } from '../hooks/useSEO'
import { TypewriterText } from '../components/TypewriterText'
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
        <TypewriterText as="pre" class="notfound-glyph" text={GLYPH} typeMs={12} aria-label="404" />
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
