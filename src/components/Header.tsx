import { useEffect, useState } from 'preact/hooks'
import { Link, useRouter } from '../router'

const NAV = [
  { href: '/about', label: 'ABOUT' },
  { href: '/donate', label: 'DONATE A GAME' },
  { href: '/credits', label: 'CREDITS' },
  { href: '/privacy', label: 'PRIVACY' },
]

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
          <span class="brand-mark">WORKSHOP.DL</span>
          <span class="brand-version">v0.4.2</span>
        </Link>

        <nav class="site-nav" aria-label="Primary">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} class={path === n.href ? 'nav-link is-active' : 'nav-link'}>
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
            class={path === n.href ? 'mobile-nav-link is-active' : 'mobile-nav-link'}
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
