# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

MODRELAY (workshop.lonewolves.dev) — direct file retrieval for published Steam Workshop items. A Preact/Vite frontend (complete, running entirely on mock data) in front of a Go backend (minimal scaffold; real Steam resolution via `go-steamcmd` is not implemented yet). Not affiliated with Valve/Steam.

## Commands

Frontend (repo root):
```sh
npm install
npm run dev      # vite dev server
npm run build    # tsc -b && vite build — this IS the verification step, there is no separate test suite
npm run preview  # serve the production build locally
```

Backend (`backend/`):
```sh
go build ./...
go vet ./...
gofmt -l .        # should print nothing
go run .          # PORT (default 8080) and REDIS_ADDR (default localhost:6379) env vars
```

Full stack via Docker Compose (nginx + backend + redis):
```sh
docker compose up --build   # site at http://localhost:8080 (HTTP_PORT in .env)
```

There is no lint config and no test suite in either half of the repo — `tsc -b` / `go vet` are what stand in for CI checks.

## Architecture

**Two independent halves.** The frontend is fully built and does not call the backend at all right now — every "API" interaction is mocked. Do not assume wiring exists between them beyond what's described below.

### Frontend data flow

`src/data/items.ts` is the mock backend. `resolveId(id)` is the single dispatch point every lookup goes through, returning a tagged union: `{ kind: 'item' | 'collection' | 'removed' | 'private' | 'not-found', ... }`. `src/pages/ItemPage.tsx` (the `/items/:id` route) switches on `kind` to render `ItemDetailView`, `CollectionView`, or `ItemErrorView`. **This is the seam to replace with real API calls** once the backend can actually resolve Workshop items — everything downstream of `resolveId` already handles all five states correctly.

### Router

`src/router.tsx` is a ~90-line dependency-free router (path/params via the History API): `RouterProvider`, `useRouter()`, `Link`, `useMatchedRoute()`. Route definitions live in `src/app.tsx`, not in the router module itself.

### SEO (no SSR)

This is a client-rendered SPA, so per-route SEO is imperative: `src/hooks/useSEO.ts` sets `document.title` and the description/canonical/OG/Twitter meta tags on every route change (every page component calls it). `index.html` carries static OG/Twitter/JSON-LD tags as the fallback for non-JS link unfurlers, which never see the per-route versions. `src/lib/seo.ts` holds `SITE_NAME`/`SITE_URL` — these do **not** propagate automatically to `index.html`, `public/robots.txt`, or `public/sitemap.xml`; all four must be edited together if the domain or name ever changes.

### Versioning (two unrelated schemes — don't conflate them)

- **On-site display version** (header badge, e.g. `v1.0.1 (6d26fcf)`): `vite.config.ts` injects `__APP_VERSION__` (from `package.json`'s `version`) and `__COMMIT_HASH__` (`git rev-parse --short=7 HEAD` at build time, falls back to `"dev"` outside a git repo) via `define`; `src/lib/version.ts` combines them. Bump `package.json`'s version manually for the base part.
- **Release/deploy versioning** (Docker image tags, GitHub Release tag/name): the 7-character short commit hash **alone** — no `v` prefix, no semver. This is a deliberate, explicit choice; see `.github/workflows/release.yml`. Don't "fix" it to look like the on-site version string.

### Styling

Plain CSS per page/component under `src/styles/`, imported directly by whichever component uses it — no CSS modules, no framework. Design tokens live in `src/index.css` as RGB-triplet custom properties (`--accent-rgb`, `--fg-rgb`, `--warn-rgb`, `--err-rgb`) used as `rgba(var(--accent-rgb), 0.35)` etc., rather than predefining a named variable per alpha value. The whole site is one accent color (phosphor green) on near-black, IBM Plex Mono only.

**No em dashes in user-facing copy.** The site uses `·` (middle dot) as its separator character throughout (bylines, tree rows, transfer log lines, page titles) — use that, not `—`, in any new copy.

### Backend

`backend/main.go` is a single file (stdlib `net/http`, Go 1.22+ method+pattern `ServeMux` routing). `/healthz` pings Redis; `/api/v1/stats` does a real Redis `INCR` (proves the container/Redis wiring, not a real feature); `/api/v1/items/{id}` is a deliberate `501 Not Implemented` — the seam for `go-steamcmd` integration.

### Infra

Root `Dockerfile` builds the frontend and serves it via nginx, which also reverse-proxies `/api/` to the backend (`nginx.conf`) — nginx is the site's single entrypoint, there's no separate frontend-only container. `backend/Dockerfile` is a separate multi-stage Go build. `docker-compose.yml` wires `nginx` → `backend` → `redis` with healthcheck-gated `depends_on`, so startup ordering is real.

### Preact conventions

JSX uses `class`/`for` (not `className`/`htmlFor`) throughout — Preact supports both, this codebase consistently uses the DOM-native names. `tsconfig.app.json` aliases `react`/`react-dom` imports to `preact/compat` for any dependency that expects React.

### `mockup/`

`mockup/Workshop Downloader.dc.html` is the original design reference (a proprietary design-tool export with its own template runtime, `support.js`) — not usable code, not part of the build. It's what the whole visual design was rebuilt from; don't edit it, and don't try to run or import it.
