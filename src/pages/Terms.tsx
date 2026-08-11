import { Link } from '../router'
import { useSEO } from '../hooks/useSEO'
import '../styles/docs.css'

const ROWS: [string, string][] = [
  [
    'THE SERVICE',
    'MODRELAY automates retrieving published Steam Workshop items and prepares them to be game ready. It is a convenience tool, not a distribution platform or a mirror.',
  ],
  [
    'NO FILE STORAGE',
    'We save no files on our own hard drives. Downloads pass straight through from Steam to you and are deleted the moment the transfer ends; see the Privacy Policy for the little we do retain.',
  ],
  [
    'NO OWNERSHIP CLAIM',
    'We do not claim ownership of any mod, and do not alter creator, game, or Steam intellectual property. All rights remain with the original creators, Valve, and Steam.',
  ],
  [
    'YOUR RESPONSIBILITY',
    'You are responsible for lawfully owning the base game before downloading its Workshop content, and for not using keys or credentials you are not authorized to use.',
  ],
  [
    'AVAILABILITY',
    "The service depends on Steam's API and a fixed daily request budget, so it may be slow, queued, or unavailable at times. Current conditions are always visible on the Status page.",
  ],
  [
    'ACCEPTABLE USE',
    'Do not automate bulk scraping of the catalogue, resell access to this service, or misrepresent it as your own. The same rules apply to anyone using the public API.',
  ],
  [
    'NO WARRANTY',
    "The service is provided as is, with no warranty of any kind. We are not liable for lost time, data, or any issue arising from a downloaded item's contents.",
  ],
  [
    'CHANGES',
    'These terms may change as the service does. Continuing to use MODRELAY after a change means you accept the update.',
  ],
]

export function Terms() {
  useSEO({
    title: 'Terms of Service',
    description: 'What using MODRELAY means: no files stored, no ownership claimed, and what is expected of you in return.',
    path: '/terms',
  })

  return (
    <div class="page-narrow doc-page">
      <div class="doc-meta-row">
        <span>$ cat terms.txt</span>
        <span>LAST MODIFIED 2026-08-11</span>
      </div>
      <h1 class="doc-title">Terms of Service</h1>
      <div class="doc-table">
        {ROWS.map(([key, val]) => (
          <div class="doc-table-row" key={key}>
            <div class="doc-table-key">{key}</div>
            <div class="doc-table-val">{val}</div>
          </div>
        ))}
      </div>
      <div class="doc-contact">
        Questions: <span class="accent-inline">terms@lonewolves.dev</span>
        <br />
        See also the{' '}
        <Link href="/privacy" class="accent-link">
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  )
}
