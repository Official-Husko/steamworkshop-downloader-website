import { Link } from '../router'
import { siteStats } from '../data/items'
import { formatCount } from '../lib/format'
import { useSEO } from '../hooks/useSEO'
import '../styles/docs.css'

export function About() {
  useSEO({
    title: 'About',
    description: 'How MODRELAY resolves and serves Steam Workshop items, and what it does and does not keep.',
    path: '/about',
  })

  return (
    <div class="page-narrow doc-page">
      <div class="doc-kicker">$ cat about.txt</div>
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
          is for.
        </p>
      </div>
      <div class="doc-stats">
        <div class="doc-stat">
          <span>items resolved</span>
          <span class="val">{formatCount(siteStats.itemsResolved)}</span>
        </div>
        <div class="doc-stat">
          <span>games covered</span>
          <span class="val">{siteStats.gamesCovered}</span>
        </div>
        <div class="doc-stat">
          <span>median resolve</span>
          <span class="val">{siteStats.medianResolveMs} ms</span>
        </div>
        <div class="doc-stat">
          <span>keys donated</span>
          <span class="val">{siteStats.keysDonated}</span>
        </div>
      </div>
      <div class="doc-legal">
        This website is a community project and is not affiliated with Valve Corporation or Steam. Steam and the
        Steam logo are trademarks of Valve Corporation.
      </div>
    </div>
  )
}
