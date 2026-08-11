import { useState } from 'preact/hooks'
import type { ComponentChildren } from 'preact'
import { Link } from '../router'
import { useSEO } from '../hooks/useSEO'
import '../styles/api.css'

const TOC = ['Overview', 'Authentication', 'GET /v1/item', 'GET /v1/collection', 'GET /v1/download', 'Errors', 'Rate limits']

// Plain-text versions, used for the clipboard copy actions — the colored
// JSX below (CurlExample/JsonExample) is for display only.
const CURL_EXAMPLE = `curl -H "Authorization: Bearer wdl_live_8f2c..." \\
     workshop.lonewolves.dev/api/v1/item/2874113045`

const JSON_EXAMPLE = `{
  "published_file_id": "2874113045",
  "result": 1,
  "file_type": "community",
  "title": "Overhauled Rail Network",
  "creator": "76561198000000000",
  "consumer_app_id": 2074010,
  "file_size": 193138278,
  "preview_url": "https://.../preview.jpg",
  "tags": ["Transport", "Buildings", "Overhaul"],
  "time_created": 1667520000,
  "time_updated": 1781740800,
  "visibility": "public",
  "banned": false,
  "votes_up": 18402,
  "votes_down": 612,
  "num_children": 0,
  "children": [],
  "download": "https://workshop.lonewolves.dev/api/v1/download/2874113045"
}`

function Str({ children }: { children: ComponentChildren }) {
  return <span class="json-str">"{children}"</span>
}
function Num({ children }: { children: ComponentChildren }) {
  return <span class="json-num">{children}</span>
}
function Bool({ children }: { children: ComponentChildren }) {
  return <span class="json-bool">{children}</span>
}
function Row({ k, children, last }: { k: string; children: ComponentChildren; last?: boolean }) {
  return (
    <>
      {'  '}
      <span class="json-key">"{k}"</span>: {children}
      {last ? '' : ','}
      {'\n'}
    </>
  )
}

function JsonExample() {
  return (
    <pre class="api-json">
      {'{\n'}
      <Row k="published_file_id">
        <Str>2874113045</Str>
      </Row>
      <Row k="result">
        <Num>1</Num>
      </Row>
      <Row k="file_type">
        <Str>community</Str>
      </Row>
      <Row k="title">
        <Str>Overhauled Rail Network</Str>
      </Row>
      <Row k="creator">
        <Str>76561198000000000</Str>
      </Row>
      <Row k="consumer_app_id">
        <Num>2074010</Num>
      </Row>
      <Row k="file_size">
        <Num>193138278</Num>
      </Row>
      <Row k="preview_url">
        <Str>https://.../preview.jpg</Str>
      </Row>
      <Row k="tags">
        [<Str>Transport</Str>, <Str>Buildings</Str>, <Str>Overhaul</Str>]
      </Row>
      <Row k="time_created">
        <Num>1667520000</Num>
      </Row>
      <Row k="time_updated">
        <Num>1781740800</Num>
      </Row>
      <Row k="visibility">
        <Str>public</Str>
      </Row>
      <Row k="banned">
        <Bool>false</Bool>
      </Row>
      <Row k="votes_up">
        <Num>18402</Num>
      </Row>
      <Row k="votes_down">
        <Num>612</Num>
      </Row>
      <Row k="num_children">
        <Num>0</Num>
      </Row>
      <Row k="children">[]</Row>
      <Row k="download" last>
        <Str>https://workshop.lonewolves.dev/api/v1/download/2874113045</Str>
      </Row>
      {'}'}
    </pre>
  )
}

function CurlExample() {
  return (
    <pre>
      curl <span class="curl-flag">-H</span> <span class="accent-inline">"Authorization: Bearer wdl_live_8f2c..."</span>{' '}
      {'\\\n     '}
      workshop.lonewolves.dev/api<span class="accent-inline">/v1/item/2874113045</span>
    </pre>
  )
}

const CRITERIA = [
  'A named, non-commercial project',
  'A stated, realistic request volume',
  'Contactable maintainer',
  'No redistribution of downloaded files',
  'Attribution back to this site',
  '30 days of ordinary site use, or a donated key',
]

const ERRORS: [string, string][] = [
  ['400', 'unparseable id or url'],
  ['401', 'missing or revoked api key'],
  ['403', 'game not covered, request it'],
  ['404', 'result 9, item removed'],
  ['429', 'rate limited, see Retry-After'],
  ['503', 'steam upstream unavailable'],
]

const RATE_LIMITS: [string, string][] = [
  ['reads', '60 / minute / ip'],
  ['downloads', '10 / minute / ip'],
  ['collection expand', 'counts as 1 read'],
  ['cache', '24 h per item'],
]

export function PublicApi() {
  useSEO({
    title: 'API',
    description: 'The same endpoints MODRELAY uses internally. JSON in, JSON out, field names mirror the Steam UGC details struct.',
    path: '/api',
  })

  const [copied, setCopied] = useState<'curl' | 'json' | null>(null)

  function copy(kind: 'curl' | 'json', text: string) {
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopied(kind)
        window.setTimeout(() => setCopied(null), 1600)
      })
      .catch(() => {})
  }

  return (
    <div class="page api-page">
      <div class="api-shell">
        <nav class="api-toc" aria-label="On this page">
          <div class="api-toc-heading">CONTENTS</div>
          {TOC.map((t, i) => (
            <div key={t} class={i === 0 ? 'api-toc-item is-active' : 'api-toc-item'}>
              {t}
            </div>
          ))}
          <div class="api-toc-base">
            Base URL
            <br />
            <span class="api-toc-base-url">workshop.lonewolves.dev/api</span>
          </div>
        </nav>

        <div class="api-content">
          <div class="doc-kicker">$ curl -s workshop.lonewolves.dev/api/v1/item/2874113045</div>
          <h1 class="doc-title" style={{ marginBottom: '12px' }}>
            API
          </h1>
          <p class="doc-copy" style={{ marginBottom: '26px' }}>
            The same endpoints the site uses. JSON in, JSON out. Field names mirror Steam's UGC details struct so
            responses can be dropped straight into existing tooling. Every endpoint requires a key.
          </p>

          <div class="api-auth-box">
            <div class="api-auth-head">
              <span class="api-auth-title">AUTHENTICATION</span>
              <span class="api-tag">INVITE ONLY</span>
            </div>
            <p class="api-auth-copy">
              Send the key as a bearer token. Keys are issued by hand; capacity is bounded by the hardware the
              service runs on, so they are not self-serve.
            </p>
            <div class="api-code">
              <CurlExample />
              <button type="button" class="api-copy" onClick={() => copy('curl', CURL_EXAMPLE)}>
                {copied === 'curl' ? 'COPIED' : 'COPY'}
              </button>
            </div>
            <div class="api-criteria">
              <div class="api-criteria-heading">CRITERIA FOR A KEY</div>
              {CRITERIA.map((c) => (
                <div class="api-criteria-item" key={c}>
                  <span class="accent-inline">·</span> {c}
                </div>
              ))}
            </div>
            <div class="api-auth-footer">
              <Link href="/api/apply" class="btn btn-primary">
                APPLY FOR A KEY
              </Link>
              <span class="api-auth-footer-note">
                Reviewed weekly. 14 of 40 slots open.
                <br />
                Keys are revoked if a project stops responding.
              </span>
            </div>
          </div>

          <div class="api-endpoint">
            <span class="api-method">GET</span>
            <span class="api-path">/v1/item/:published_file_id</span>
          </div>
          <p class="api-endpoint-note">
            Resolves a single published file. Accepts a bare id or a full Workshop URL as{' '}
            <span class="accent-inline">?url=</span>.
          </p>
          <div class="api-response">
            <div class="api-response-head">
              <span>200 OK · application/json</span>
              <button type="button" class="api-copy-inline" onClick={() => copy('json', JSON_EXAMPLE)}>
                {copied === 'json' ? 'COPIED' : 'COPY'}
              </button>
            </div>
            <JsonExample />
          </div>

          <div class="api-endpoint">
            <span class="api-method">GET</span>
            <span class="api-path">/v1/collection/:id</span>
          </div>
          <p class="api-endpoint-note">
            Same shape, with <span class="accent-inline">children[]</span> fully expanded. Unresolvable children keep
            their id and carry a <span class="accent-inline">result</span> code instead of metadata.
          </p>

          <div class="api-endpoint">
            <span class="api-method">GET</span>
            <span class="api-path">/v1/download/:id</span>
          </div>
          <p class="api-endpoint-note" style={{ marginBottom: '22px' }}>
            302 to a short-lived signed URL. Add <span class="accent-inline">?format=zip</span> on a collection to
            receive one archive.
          </p>

          <div class="api-grid">
            <div>
              <div class="api-grid-heading">ERRORS</div>
              {ERRORS.map(([code, msg]) => (
                <div class="api-grid-row" key={code}>
                  <span class="api-grid-code">{code}</span>
                  {msg}
                </div>
              ))}
            </div>
            <div>
              <div class="api-grid-heading">RATE LIMITS</div>
              {RATE_LIMITS.map(([k, v]) => (
                <div class="api-rate-row" key={k}>
                  <span>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
              <div class="api-rate-note">
                Need more? Mail <span class="accent-inline">api@lonewolves.dev</span> with what you are building.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
