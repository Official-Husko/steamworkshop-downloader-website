// __APP_VERSION__/__COMMIT_HASH__ are injected at build time by vite.config.ts
// (base version from package.json, hash from `git rev-parse --short=7 HEAD`,
// falling back to "dev" outside a git repo).
export const APP_VERSION = `v${__APP_VERSION__}`
export const COMMIT_HASH = __COMMIT_HASH__

export const DISPLAY_VERSION = COMMIT_HASH === 'dev' ? APP_VERSION : `${APP_VERSION} (${COMMIT_HASH})`
