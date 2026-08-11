import '../styles/docs.css'

const ROWS: [string, string][] = [
  ['LOOKUPS', 'The item IDs you resolve are cached for 24 hours to reduce API load. They are not tied to you.'],
  ['DOWNLOADS', 'Files pass through and are deleted once the transfer ends. Nothing is archived or mirrored.'],
  ['LOGS', 'IP addresses appear in rate-limiting logs, truncated to a /24 and dropped after 7 days.'],
  [
    'DONATIONS',
    'Steam keys are encrypted at rest and deleted after redemption. A credits name is stored only if you tick the box, and removed on request. Messages are read once and not published.',
  ],
  ['COOKIES', "None. Recent lookups live in your browser's local storage and never leave the device."],
  ['THIRD PARTIES', 'Requests are made to Steam’s API on your behalf. No analytics, no ad networks, no embedded scripts.'],
]

export function Privacy() {
  return (
    <div class="page-narrow doc-page">
      <div class="doc-meta-row">
        <span>$ cat privacy.txt</span>
        <span>LAST MODIFIED 2026-08-11</span>
      </div>
      <h1 class="doc-title">What we hold, and for how long</h1>
      <div class="doc-table">
        {ROWS.map(([key, val]) => (
          <div class="doc-table-row" key={key}>
            <div class="doc-table-key">{key}</div>
            <div class="doc-table-val">{val}</div>
          </div>
        ))}
      </div>
      <div class="doc-contact">
        Questions or a removal request: <span class="accent-inline">privacy@workshop.dl</span>
      </div>
    </div>
  )
}
