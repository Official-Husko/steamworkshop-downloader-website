import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { appDefines } from './vite.shared.ts'

// index.html and admin.html both live at the project root. Vite's dev
// server has no concept of "this config's app" — for any GET request that
// looks like a client-side route (no file extension) and isn't a real file
// or a Vite/dev internal path, its built-in SPA fallback resolves to
// index.html (the public site) rather than admin.html. That breaks a hard
// refresh on every admin route (e.g. /keys/donated): the public app loads,
// its router doesn't recognize that path, and its own 404 page renders —
// exactly the bug this middleware exists to prevent.
//
// Production is unaffected: nginx's `try_files $uri /admin.html` (see
// nginx.conf) already does this correctly, and the admin build lives in
// its own directory there with no index.html alongside it at all — this
// ambiguity only exists in dev, where both HTML files share one root.
function serveAdminHtmlForClientRoutes(): Plugin {
  return {
    name: 'serve-admin-html-for-client-routes',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url ?? ''
        const [pathname] = url.split('?')
        const isDevInternal =
          pathname.startsWith('/@') || pathname.startsWith('/src/') || pathname.startsWith('/node_modules/')
        // /admin/* is the backend proxy path (see Overview.tsx's fetch('/admin/healthz'))
        // — a real endpoint in production, and deliberately unreachable-but-not-HTML
        // in dev per that component's own documented fallback. Never rewrite it.
        const isBackendProxyPath = pathname.startsWith('/admin/')
        const looksLikeRoute = !isDevInternal && !isBackendProxyPath && !pathname.includes('.')
        if (req.method === 'GET' && looksLikeRoute) {
          req.url = '/admin.html'
        }
        next()
      })
    },
  }
}

// Separate app, separate bundle, separate port — kept apart from the
// public site (vite.config.ts) rather than added as routes to it, so the
// admin bundle is never shipped to public visitors at all.
export default defineConfig({
  plugins: [preact(), serveAdminHtmlForClientRoutes()],
  define: appDefines,
  server: {
    port: 5174,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: 'admin.html',
    },
    outDir: 'dist-admin',
    emptyOutDir: true,
  },
})
