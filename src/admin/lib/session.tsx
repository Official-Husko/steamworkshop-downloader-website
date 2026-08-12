import { createContext, type ComponentChildren } from 'preact'
import { useContext, useState } from 'preact/hooks'

// Mock-only auth: there is no real backend auth yet (see CLAUDE.md). This
// simulates the access-code flow entirely client-side so the login screen
// can be exercised end to end, gated by a hardcoded demo code rather than
// any real credential.
const MOCK_ACCESS_CODE = '000000'
const MAX_ATTEMPTS = 3
const SESSION_MS = 4 * 60 * 60 * 1000
const BASE_LOCKOUT_MS = 15 * 60 * 1000

const SESSION_KEY = 'wsdl:admin-session'
const LOCKOUT_KEY = 'wsdl:admin-lockout'

interface LockoutState {
  attempts: number
  lockedUntil: number | null
  lockoutMs: number
}

const EMPTY_LOCKOUT: LockoutState = { attempts: 0, lockedUntil: null, lockoutMs: BASE_LOCKOUT_MS }

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable — session just won't persist across reloads */
  }
}

export type AttemptResult = 'ok' | 'wrong' | 'locked'

interface AdminSessionCtx {
  authenticated: boolean
  expiresAt: number | null
  attempt: (code: string) => AttemptResult
  lock: () => void
  maxAttempts: number
  lockedUntil: number | null
  isLocked: boolean
}

const SessionContext = createContext<AdminSessionCtx | null>(null)

// A single shared instance for the whole admin app — every component
// that calls useAdminSession() must see the same state. Each component
// calling its own useState here (the original bug) meant Login's
// post-auth state update was invisible to Gate/AdminShell: the URL
// changed (the router itself is a proper shared context) but the
// component tree kept rendering the login screen forever.
export function AdminSessionProvider({ children }: { children: ComponentChildren }) {
  const [expiresAt, setExpiresAt] = useState<number | null>(
    () => readJSON<{ expiresAt: number } | null>(SESSION_KEY, null)?.expiresAt ?? null,
  )
  const [lockout, setLockout] = useState<LockoutState>(() => readJSON(LOCKOUT_KEY, EMPTY_LOCKOUT))

  const authenticated = expiresAt != null && expiresAt > Date.now()
  const isLocked = lockout.lockedUntil != null && lockout.lockedUntil > Date.now()

  function attempt(code: string): AttemptResult {
    if (isLocked) return 'locked'

    if (code === MOCK_ACCESS_CODE) {
      const exp = Date.now() + SESSION_MS
      writeJSON(SESSION_KEY, { expiresAt: exp })
      setExpiresAt(exp)
      writeJSON(LOCKOUT_KEY, EMPTY_LOCKOUT)
      setLockout(EMPTY_LOCKOUT)
      return 'ok'
    }

    const attempts = lockout.attempts + 1
    if (attempts >= MAX_ATTEMPTS) {
      // Lockout duration doubles each time it triggers, per the mockup's
      // stated behavior.
      const next: LockoutState = {
        attempts: 0,
        lockedUntil: Date.now() + lockout.lockoutMs,
        lockoutMs: lockout.lockoutMs * 2,
      }
      writeJSON(LOCKOUT_KEY, next)
      setLockout(next)
      return 'locked'
    }

    const next = { ...lockout, attempts }
    writeJSON(LOCKOUT_KEY, next)
    setLockout(next)
    return 'wrong'
  }

  function lock() {
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
    setExpiresAt(null)
  }

  return (
    <SessionContext.Provider
      value={{ authenticated, expiresAt, attempt, lock, maxAttempts: MAX_ATTEMPTS, lockedUntil: lockout.lockedUntil, isLocked }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useAdminSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useAdminSession must be used within AdminSessionProvider')
  return ctx
}
