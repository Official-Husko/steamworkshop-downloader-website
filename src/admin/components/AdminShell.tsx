import type { ComponentChildren, JSX } from 'preact'
import { useCountdown } from '../../hooks/useCountdown'
import { useAdminSession } from '../lib/session'
import { donatedKeysCounts, apiApplicationsCounts, issuedKeysCounts } from '../data/keys'
import { requestedGamesCounts } from '../data/content'
import { messageHistory } from '../data/messages'
import { trafficHeaderVisitors } from '../data/traffic'
import { coverageHeader } from '../data/coverage'
import { creditsHeader } from '../data/credits'
import { Link, useRouter } from '../../router'
import { formatCountdown, formatCount } from '../../lib/format'
import '../styles/shell.css'

interface NavItem {
  href: string
  label: string
  badge?: string
  badgeClass?: 'is-warn' | 'is-live'
}
interface NavGroup {
  heading: string
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    heading: 'CONSOLE',
    items: [
      { href: '/', label: 'Overview' },
      { href: '/traffic', label: 'Traffic' },
      { href: '/logs', label: 'Logs', badge: 'live', badgeClass: 'is-live' },
    ],
  },
  {
    heading: 'KEYS',
    items: [
      { href: '/keys/donated', label: 'Donated keys', badge: String(donatedKeysCounts.unredeemed), badgeClass: 'is-warn' },
      { href: '/keys/applications', label: 'API applications', badge: String(apiApplicationsCounts.pending), badgeClass: 'is-warn' },
      { href: '/keys/issued', label: 'Issued keys' },
    ],
  },
  {
    heading: 'CONTENT',
    items: [
      { href: '/content/requested-games', label: 'Requested games' },
      { href: '/content/coverage', label: 'Game coverage' },
      { href: '/content/credits', label: 'Credits list' },
    ],
  },
  {
    heading: 'SERVICE',
    items: [
      { href: '/service/messages', label: 'Site messages' },
      { href: '/service/maintenance', label: 'Maintenance' },
    ],
  },
]

/** "/keys/donated" -> "donated keys" for the header breadcrumb. */
function crumbFor(path: string): string | null {
  for (const group of NAV) {
    for (const item of group.items) {
      if (item.href === path) return item.label.toLowerCase()
    }
  }
  return null
}

interface HeaderConfig {
  stat?: JSX.Element
  operator?: boolean
  session?: boolean
}

/** Each admin screen shows a different contextual stat (or none) before
 * operator/SESSION/LOCK — not a single fixed pattern. Mirrors each
 * screen's mockup exactly rather than a normalized default. */
function headerConfigFor(path: string): HeaderConfig {
  const liveMessages = messageHistory.filter((m) => m.live).length
  switch (path) {
    case '/':
      return { stat: <span class="admin-header-pending">{apiApplicationsCounts.pending} PENDING</span>, operator: true, session: true }
    case '/traffic':
      return { stat: <span>{trafficHeaderVisitors} VISITORS · 24 H</span>, session: true }
    case '/logs':
      return { stat: <span class="admin-header-live">● TAILING</span>, session: true }
    case '/keys/donated':
      return { operator: true, session: true }
    case '/keys/applications':
      return { stat: <span>{apiApplicationsCounts.slotsOpen} OF {apiApplicationsCounts.slotsCap} SLOTS OPEN</span>, session: true }
    case '/keys/issued':
      return { stat: <span>{issuedKeysCounts.active} ACTIVE · {issuedKeysCounts.cap} CAP</span>, session: true }
    case '/content/requested-games':
      return {
        stat: (
          <span>
            {formatCount(requestedGamesCounts.total)} REQUESTS · {formatCount(requestedGamesCounts.coveredGames)} COVERED
          </span>
        ),
        session: true,
      }
    case '/content/coverage':
      return {
        stat: (
          <>
            <span>{coverageHeader.games} GAMES</span>
            <span class="admin-header-pending">{coverageHeader.broken} BROKEN</span>
          </>
        ),
      }
    case '/content/credits':
      return { stat: <span>{creditsHeader.shown} SHOWN · {creditsHeader.anonymous} ANONYMOUS</span> }
    case '/service/messages':
      return { stat: <span class="admin-header-pending">{liveMessages} LIVE</span> }
    case '/service/maintenance':
      return {}
    default:
      return { operator: true, session: true }
  }
}

export function AdminShell({ children }: { children: ComponentChildren }) {
  const { path } = useRouter()
  const { expiresAt, lock } = useAdminSession()
  const remaining = useCountdown(expiresAt ?? 0)
  const crumb = crumbFor(path)
  const headerConfig = headerConfigFor(path)

  return (
    <div class="admin-shell">
      <header class="admin-header">
        <div class="admin-header-left">
          <span class="admin-brand">WORKSHOP.DL</span>
          <span class="admin-badge">ADMIN</span>
          {crumb && <span class="admin-crumb">/ {crumb}</span>}
        </div>
        <div class="admin-header-right">
          {headerConfig.stat}
          {headerConfig.operator && <span>operator</span>}
          {headerConfig.session && <span>SESSION {formatCountdown(remaining)}</span>}
          <button type="button" class="admin-lock-btn" onClick={lock}>
            LOCK
          </button>
        </div>
      </header>

      <div class="admin-body">
        <nav class="admin-rail" aria-label="Admin sections">
          {NAV.map((group) => (
            <div key={group.heading}>
              <div class="admin-rail-group">{group.heading}</div>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  class={item.href === path ? 'admin-rail-item is-active' : 'admin-rail-item'}
                >
                  <span>{item.label}</span>
                  {item.badge && <span class={`admin-rail-badge ${item.badgeClass ?? ''}`}>{item.badge}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <main class="admin-main">{children}</main>
      </div>
    </div>
  )
}
