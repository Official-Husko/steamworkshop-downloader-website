import { useState } from 'preact/hooks'
import { Link } from '../router'
import { useSEO } from '../hooks/useSEO'
import '../styles/api.css'

const HARD_RULES = [
  'One key per project, one project per person.',
  'Server-side only. A key found in client code is revoked on sight.',
  'No scraping the whole catalogue. Resolve what a user asked for.',
  'Cache for 24 hours minimum.',
  'Identify yourself in the User-Agent.',
  'No commercial resale of the responses.',
]

const AGREEMENTS = [
  'I will not redistribute, mirror or resell downloaded files.',
  'I will cache responses and respect Retry-After rather than retrying in a loop.',
  'I will keep the key server-side and rotate it if it leaks.',
  'I will credit this site where the data is shown.',
]

export function ApiApply() {
  useSEO({
    title: 'Apply for an API Key',
    description: 'Request programmatic access to the same endpoints MODRELAY uses internally. Keys are issued by hand, one at a time.',
    path: '/api/apply',
  })

  const [projectName, setProjectName] = useState('')
  const [whatItDoes, setWhatItDoes] = useState('')
  const [email, setEmail] = useState('')
  const [reqPerDay, setReqPerDay] = useState('')
  const [source, setSource] = useState('')
  const [agreed, setAgreed] = useState<boolean[]>(() => AGREEMENTS.map(() => false))
  const [submitted, setSubmitted] = useState(false)

  const agreedCount = agreed.filter(Boolean).length
  const boxesLeft = AGREEMENTS.length - agreedCount
  const canSubmit = projectName.trim() && whatItDoes.trim() && email.trim() && boxesLeft === 0

  function toggle(i: number) {
    setAgreed((a) => a.map((v, j) => (j === i ? !v : v)))
  }

  function handleSubmit(e: Event) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitted(true)
  }

  return (
    <div class="page apply-page">
      <div class="apply-meta-row">
        <span>$ ./apply --api-key</span>
        <span>14 OF 40 SLOTS OPEN</span>
      </div>
      <h1 class="apply-title">Apply for an API key</h1>
      <p class="apply-intro">
        The service runs on a single machine against a fixed daily budget: 100,000 requests per 24 hours, set by
        Steam. Keys are therefore handed out one at a time, and the rules below are enforced rather than suggested.
        Read them before applying; most rejections are for missing one of the first three.
      </p>

      <div class="apply-grid">
        <form class="apply-form" onSubmit={handleSubmit}>
          {submitted ? (
            <div class="ok-box">
              <div class="box-title">APPLICATION RECEIVED</div>
              <div class="box-body">
                Thanks, applications are reviewed weekly and answered either way at {email}.
              </div>
            </div>
          ) : (
            <>
              <div>
                <div class="field-label">
                  <span class="req">PROJECT NAME</span>
                  <span class="req">REQUIRED</span>
                </div>
                <input
                  class="field-input"
                  value={projectName}
                  onInput={(e) => setProjectName((e.target as HTMLInputElement).value)}
                  placeholder="Modpack Archiver"
                />
              </div>

              <div>
                <div class="field-label">
                  <span class="req">WHAT IT DOES</span>
                  <span class="req">REQUIRED</span>
                </div>
                <textarea
                  class="field-textarea"
                  rows={3}
                  value={whatItDoes}
                  onInput={(e) => setWhatItDoes((e.target as HTMLTextAreaElement).value)}
                  placeholder="Two or three sentences. Say who uses it and how often."
                />
              </div>

              <div class="apply-row">
                <div>
                  <div class="field-label">
                    <span class="req">CONTACT EMAIL</span>
                    <span class="req">REQUIRED</span>
                  </div>
                  <input
                    class="field-input"
                    type="email"
                    value={email}
                    onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div class="apply-narrow">
                  <div class="field-label">
                    <span class="req">REQ / DAY</span>
                    <span class="req">REQ</span>
                  </div>
                  <input
                    class="field-input"
                    value={reqPerDay}
                    onInput={(e) => setReqPerDay((e.target as HTMLInputElement).value)}
                    placeholder="e.g. 400"
                  />
                </div>
              </div>

              <div>
                <div class="field-label">
                  <span>SOURCE OR HOMEPAGE</span>
                  <span class="opt">OPTIONAL</span>
                </div>
                <input
                  class="field-input"
                  value={source}
                  onInput={(e) => setSource((e.target as HTMLInputElement).value)}
                  placeholder="A repo helps. Closed source is accepted with a description."
                />
              </div>

              <div class="apply-agree">
                <div class="apply-agree-heading">YOU MUST AGREE TO ALL FOUR</div>
                {AGREEMENTS.map((text, i) => (
                  <label class={agreed[i] ? 'apply-check is-checked' : 'apply-check'} key={text}>
                    <input type="checkbox" checked={agreed[i]} onChange={() => toggle(i)} />
                    <span class="apply-check-box" aria-hidden="true">
                      {agreed[i] ? '[×]' : '[ ]'}
                    </span>
                    <span class="apply-check-label">
                      {i === 1 ? (
                        <>
                          I will cache responses and respect <span class="accent-inline">Retry-After</span> rather
                          than retrying in a loop.
                        </>
                      ) : (
                        text
                      )}
                    </span>
                  </label>
                ))}
              </div>

              <div class="apply-submit-row">
                <button type="submit" class="btn btn-primary" disabled={!canSubmit}>
                  SUBMIT APPLICATION
                </button>
                <span class="apply-submit-hint">
                  {boxesLeft > 0 ? `${boxesLeft} box${boxesLeft > 1 ? 'es' : ''} left to tick.` : 'Ready to submit.'}
                  <br />
                  Reviewed weekly, answered either way.
                </span>
              </div>
            </>
          )}
        </form>

        <aside class="apply-sidebar">
          <div class="apply-sidebar-heading">HARD RULES</div>
          <div class="apply-rules">
            {HARD_RULES.map((rule, i) => (
              <div key={rule}>
                <span class="accent-inline">{String(i + 1).padStart(2, '0')}</span> {rule}
              </div>
            ))}
          </div>
          <div class="warn-box apply-sidebar-warn">
            <div class="box-body">Breaking rules 02 or 03 is an immediate, permanent revocation. Everything else gets one warning.</div>
          </div>
          <div class="apply-sidebar-note">
            Rejected? Reapply after 30 days, or send a key from the{' '}
            <Link href="/donate" class="accent-link">
              donation page
            </Link>
            , donors skip the queue.
          </div>
        </aside>
      </div>
    </div>
  )
}
