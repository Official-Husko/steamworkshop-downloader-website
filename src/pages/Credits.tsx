import { donorNames } from '../data/items'
import { nameHue } from '../lib/hue'
import '../styles/docs.css'
import '../styles/credits.css'

export function Credits() {
  return (
    <div class="page-narrow credits-page">
      <div class="doc-kicker">$ cat credits.txt | sort</div>
      <h1 class="doc-title">People who donated a game</h1>
      <p class="doc-copy" style={{ marginBottom: '26px' }}>
        Everyone here gave a key and asked to be named. Colour is derived from the name itself, so the same name
        always renders the same hue.
      </p>
      <div class="credits-grid">
        {donorNames.map((name, i) => {
          const hue = nameHue(name)
          const color = `oklch(0.80 0.14 ${hue})`
          return (
            <div class="credits-chip" key={name} style={{ animationDelay: `${Math.min(i, 16) * 20}ms` }}>
              <span class="credits-dot" style={{ background: color }} />
              <span class="credits-name" style={{ color }}>
                {name}
              </span>
              <span class="credits-hue">{String(hue).padStart(3, '0')}°</span>
            </div>
          )
        })}
      </div>
      <div class="credits-footer">
        <div>
          Plus 41 anonymous donations.
          <br />
          Names are removed on request, at which point the colour goes with them.
        </div>
        <div class="credits-formula">
          hue = fnv1a(name) mod 360
          <br />
          lightness 0.80 · chroma 0.14 fixed
          <br />
          so no name lands on an unreadable colour
        </div>
      </div>
    </div>
  )
}
