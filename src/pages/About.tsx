import { useState } from 'preact/hooks'
import { Link } from '../router'
import { siteStats } from '../data/items'
import { formatCount } from '../lib/format'
import { useSEO } from '../hooks/useSEO'
import { TerminalTextInput } from '../components/TerminalTextInput'
import { TypewriterText } from '../components/TypewriterText'
import '../styles/docs.css'
import '../styles/about.css'

const DESKTOP_FEATURES = [
  'Direct game install, per library folder',
  'Collections installed in one pass',
  'Dependency resolution',
  'Update checks against time_updated',
  'Offline library of what you pulled',
  'Queue and resume',
]

export function About() {
  useSEO({
    title: 'About',
    description: 'How MODRELAY resolves and serves Steam Workshop items, and what it does and does not keep.',
    path: '/about',
  })

  const [email, setEmail] = useState('')
  const [notified, setNotified] = useState(false)

  function handleNotify(e: Event) {
    e.preventDefault()
    if (!email.trim()) return
    setNotified(true)
  }

  return (
    <div class="page-narrow doc-page">
      <TypewriterText as="div" class="doc-kicker" text="$ cat about.txt" />
      <h1 class="doc-title">About</h1>
      <div class="doc-copy">
        <p>
          MODRELAY resolves published Workshop items through the Steam UGC API and returns their files directly.
          It exists because keeping a mod after the game is uninstalled, or reading a mod's contents before running
          it, should not require a client.
        </p>
        <p>
          Requests are made server-side. The site holds no Steam account of yours, sets no tracking cookies, and
          keeps no copy of the files after a transfer finishes.
        </p>
        <p>
          Some games gate Workshop access behind ownership. Coverage for those depends on donated keys, which is
          what the{' '}
          <Link href="/donate" class="accent-link">
            donation page
          </Link>{' '}
          is for, and on demand, which is what{' '}
          <Link href="/request" class="accent-link">
            requests
          </Link>{' '}
          measure.
        </p>
      </div>
      <div class="doc-stats-4">
        <div class="about-stat">
          <div class="about-stat-value">{formatCount(siteStats.itemsResolved)}</div>
          <div class="about-stat-label">ITEMS RESOLVED</div>
        </div>
        <div class="about-stat">
          <div class="about-stat-value">{siteStats.gamesCovered}</div>
          <div class="about-stat-label">GAMES COVERED</div>
        </div>
        <div class="about-stat">
          <div class="about-stat-value">{siteStats.medianResolveMs} ms</div>
          <div class="about-stat-label">MEDIAN RESOLVE</div>
        </div>
        <div class="about-stat">
          <div class="about-stat-value">{siteStats.keysDonated}</div>
          <div class="about-stat-label">KEYS DONATED</div>
        </div>
      </div>

      <div class="ok-box about-source-box">
        <div class="box-title">SOURCE · CLOSED FOR NOW</div>
        <div class="box-body">
          The codebase is closed source while the core feature set, Steam resolution, the public API, and the
          desktop tool, is still being built. Once that work is done, the whole project will be published as open
          source rather than kept closed indefinitely.
        </div>
      </div>

      <div class="desktop-teaser">
        <div class="desktop-teaser-inner">
          <div class="desktop-teaser-head">
            <span class="desktop-teaser-badge">COMING SOON</span>
            <span class="desktop-teaser-kicker">MODRELAY DESKTOP · WIN / LINUX / MACOS</span>
          </div>
          <div class="desktop-teaser-title">Install straight into the game, not into a folder</div>
          <p class="desktop-teaser-copy">
            A desktop companion that finds your local Steam library and puts a downloaded item where the game
            actually reads it: the right workshop content directory, the right app id, dependencies pulled in with
            it. You pick how it talks to Steam.
          </p>

          <div class="desktop-options">
            <div class="desktop-option is-selected">
              <div class="desktop-option-head">
                <span class="desktop-option-radio">(●)</span>
                <span class="desktop-option-name">Official API</span>
              </div>
              <div class="desktop-option-copy">
                Uses the documented Steam client interfaces on a machine where Steam is already signed in. Nothing is
                scripted around the client, subscriptions stay in sync, and the game sees the item exactly as if you
                had subscribed.
              </div>
            </div>
            <div class="desktop-option">
              <div class="desktop-option-head">
                <span class="desktop-option-radio">( )</span>
                <span class="desktop-option-name">SteamCMD directly</span>
              </div>
              <div class="desktop-option-copy">
                Drives a local SteamCMD install for headless machines, dedicated servers, and games you own but do
                not have installed. Slower on first run, works without the graphical client.
              </div>
            </div>
          </div>

          <div class="desktop-features">
            {DESKTOP_FEATURES.map((f) => (
              <span key={f}>
                <span class="accent-inline">·</span> {f}
              </span>
            ))}
          </div>

          {notified ? (
            <div class="ok-box desktop-notify-done">
              <div class="box-title">ON THE LIST</div>
              <div class="box-body">One mail at release, then the address is deleted.</div>
            </div>
          ) : (
            <form class="desktop-notify" onSubmit={handleNotify}>
              <div class="desktop-notify-bar">
                <span class="accent-inline">&gt;</span>
                <TerminalTextInput
                  class="desktop-notify-input"
                  type="email"
                  value={email}
                  onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                  placeholder="email for the beta"
                  autoComplete="off"
                />
              </div>
              <button type="submit" class="btn btn-primary">
                NOTIFY ME
              </button>
              <span class="desktop-notify-note">
                One mail at release.
                <br />
                Address is deleted after it is sent.
              </span>
            </form>
          )}
        </div>
      </div>

      <div class="doc-legal">
        This website is a community project and is not affiliated with Valve Corporation or Steam. Steam and the
        Steam logo are trademarks of Valve Corporation. SteamCMD is provided by Valve; the desktop tool automates a
        copy you install yourself.
      </div>
    </div>
  )
}
