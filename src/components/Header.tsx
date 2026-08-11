import { useEffect, useState } from 'preact/hooks'
import { Link, useRouter } from '../router'
import { DISPLAY_VERSION } from '../lib/version'

const NAV = [
  { href: '/about', label: 'ABOUT' },
  { href: '/api', label: 'API' },
  { href: '/request', label: 'REQUEST A GAME' },
  { href: '/donate', label: 'DONATE A GAME' },
  { href: '/status', label: 'STATUS' },
  { href: '/credits', label: 'CREDITS' },
  { href: '/privacy', label: 'PRIVACY' },
]

function isNavActive(path: string, href: string): boolean {
  return path === href || path.startsWith(`${href}/`)
}

export function Header() {
  const { path, navigate } = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [path])

  return (
    <header class="site-header">
      <div class="site-header-bar">
        <Link href="/" class="brand">
          <span class="brand-mark">MODRELAY</span>
          <span class="brand-version">{DISPLAY_VERSION}</span>
        </Link>

        <nav class="site-nav" aria-label="Primary">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} class={isNavActive(path, n.href) ? 'nav-link is-active' : 'nav-link'}>
              {n.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          class="menu-toggle"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          MENU <span class={menuOpen ? 'caret is-open' : 'caret'}>▾</span>
        </button>
      </div>

      <nav class={menuOpen ? 'mobile-nav is-open' : 'mobile-nav'} aria-label="Primary mobile">
        {NAV.map((n) => (
          <a
            key={n.href}
            href={n.href}
            class={isNavActive(path, n.href) ? 'mobile-nav-link is-active' : 'mobile-nav-link'}
            onClick={(e) => {
              e.preventDefault()
              navigate(n.href)
            }}
          >
            {n.label}
          </a>
        ))}
      </nav>
    </header>
  )
}
