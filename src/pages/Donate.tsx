import { useState } from 'preact/hooks'
import { Link } from '../router'
import { mostRequestedNeedingKey } from '../data/requests'
import { useSEO } from '../hooks/useSEO'
import '../styles/docs.css'
import '../styles/donate.css'

function formatKeyInput(raw: string): string {
  const clean = raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 15)
  return clean.match(/.{1,5}/g)?.join('-') ?? clean
}

export function Donate() {
  useSEO({
    title: 'Donate a Game',
    description: 'Donate a Steam key to widen Workshop coverage for games that require ownership to resolve.',
    path: '/donate',
  })

  const [game, setGame] = useState('')
  const [key, setKey] = useState('')
  const [message, setMessage] = useState('')
  const [creditsName, setCreditsName] = useState('')
  const [showCredit, setShowCredit] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(false)

  function handleSubmit(e: Event) {
    e.preventDefault()
    if (key.replace(/-/g, '').length < 15) {
      setError(true)
      return
    }
    setError(false)
    setSubmitted(true)
  }

  return (
    <div class="page donate-page">
      <div class="doc-kicker">$ ./donate --key</div>
      <h1 class="donate-title">Give a key, widen the coverage</h1>
      <p class="donate-intro">
        Some games must be owned before their Workshop items can be resolved. A donated key makes every item for
        that game downloadable here. Keys are redeemed manually and never resold.
      </p>

      <div class="donate-grid">
        <form class="donate-form" onSubmit={handleSubmit}>
          {submitted ? (
            <div class="ok-box">
              <div class="box-title">KEY RECEIVED</div>
              <div class="box-body">
                Thanks, it'll be redeemed manually within a few days.
                {showCredit && creditsName ? ` You'll show up on the credits page as "${creditsName}".` : ''}
              </div>
            </div>
          ) : (
            <>
              <div>
                <div class="field-label">
                  <span>GAME NAME</span>
                  <span class="opt">OPTIONAL</span>
                </div>
                <input
                  class="field-input"
                  value={game}
                  onInput={(e) => setGame((e.target as HTMLInputElement).value)}
                  placeholder="Stellar Drift"
                />
                <div class="field-hint">Leave blank and we resolve it from the key.</div>
              </div>

              <div>
                <div class="field-label">
                  <span class="req">STEAM KEY</span>
                  <span class="req">REQUIRED</span>
                </div>
                <div class={error ? 'field-input key-input has-error' : 'field-input key-input'}>
                  <span class="key-prompt">&gt;</span>
                  <input
                    value={key}
                    onInput={(e) => {
                      setKey(formatKeyInput((e.target as HTMLInputElement).value))
                      setError(false)
                    }}
                    placeholder="XXXXX-XXXXX-XXXXX"
                    maxLength={17}
                    autoComplete="off"
                    spellcheck={false}
                  />
                </div>
                {error && <div class="field-hint is-error">Enter a full 15-character key.</div>}
              </div>

              <div>
                <div class="field-label">
                  <span>MESSAGE</span>
                  <span class="opt">OPTIONAL</span>
                </div>
                <textarea
                  class="field-textarea"
                  rows={3}
                  value={message}
                  onInput={(e) => setMessage((e.target as HTMLTextAreaElement).value)}
                  placeholder="Spare copy from a bundle. Hope it helps."
                />
              </div>

              <div>
                <div class="field-label">
                  <span>CREDITS NAME</span>
                  <span class="opt">OPTIONAL</span>
                </div>
                <input
                  class="field-input"
                  value={creditsName}
                  onInput={(e) => setCreditsName((e.target as HTMLInputElement).value)}
                  placeholder="How you want to appear on the credits page"
                />
              </div>

              <label class="donate-check">
                <input
                  type="checkbox"
                  checked={showCredit}
                  onChange={(e) => setShowCredit((e.target as HTMLInputElement).checked)}
                />
                <span class="donate-check-box" aria-hidden="true">
                  {showCredit ? '[×]' : '[ ]'}
                </span>
                <span>
                  <div>I want my name shown on the credits page</div>
                  <div class="donate-check-hint">Unticked, the donation stays anonymous and no name is stored.</div>
                </span>
              </label>

              <div class="donate-submit-row">
                <button type="submit" class="btn btn-primary">
                  SUBMIT KEY
                </button>
                <span class="donate-submit-hint">
                  Encrypted at rest.
                  <br />
                  Deleted after redemption.
                </span>
              </div>
            </>
          )}
        </form>

        <aside class="donate-sidebar">
          <div class="donate-sidebar-heading-row">
            <div class="donate-sidebar-heading">MOST REQUESTED</div>
            <Link href="/request" class="accent-link donate-sidebar-see-all">
              see all
            </Link>
          </div>
          <div class="donate-sidebar-list">
            {mostRequestedNeedingKey(5).map((g) => (
              <div class="donate-sidebar-row" key={g.appId}>
                <span>{g.name}</span>
                <span class="mono-dim">{g.count}</span>
              </div>
            ))}
          </div>
          <div class="donate-sidebar-note">
            A key is redeemed on a dedicated account used only to resolve Workshop items. It is never used to play,
            review or trade.
          </div>
          <div class="warn-box donate-sidebar-warn">
            <div class="box-body">Do not send keys for games you did not lawfully obtain.</div>
          </div>
        </aside>
      </div>
    </div>
  )
}
