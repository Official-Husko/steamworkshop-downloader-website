import { execSync } from 'node:child_process'
import pkg from './package.json' with { type: 'json' }

function commitHash(): string {
  try {
    return execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'dev'
  }
}

// Shared between vite.config.ts and vite.admin.config.ts so both bundles
// get real values for the __APP_VERSION__/__COMMIT_HASH__ globals declared
// in src/vite-env.d.ts — that file only declares the ambient types, a
// config that skips this define block would throw a ReferenceError at
// runtime instead of a build-time error.
export const appDefines = {
  __APP_VERSION__: JSON.stringify(pkg.version),
  __COMMIT_HASH__: JSON.stringify(commitHash()),
}
