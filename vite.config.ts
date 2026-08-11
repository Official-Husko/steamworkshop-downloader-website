import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import pkg from './package.json' with { type: 'json' }

function commitHash(): string {
  try {
    return execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'dev'
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __COMMIT_HASH__: JSON.stringify(commitHash()),
  },
})
