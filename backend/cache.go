package main

import (
	"container/list"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"sync"
	"time"
)

const (
	// resolveCacheTTL matches the Privacy Policy's existing public promise
	// ("cached for 24 hours to reduce API load") -- not an arbitrary pick.
	resolveCacheTTL = 24 * time.Hour
	// degradedResolveCacheTTL applies to entries resolved via the
	// key-free fallback (see resolve.go's fetch) instead of the richer
	// keyed GetDetails endpoint -- shorter so they're naturally retried
	// against the better source soon, rather than sitting on
	// vote-less/appid-only data for a full day.
	degradedResolveCacheTTL = 1 * time.Hour
	// maxResolveCacheEntries bounds a real DoS vector: garbage-id
	// enumeration against /api/v1/items/{random} would otherwise cache
	// negative results forever with no limit.
	maxResolveCacheEntries   = 100_000
	resolveCacheSaveInterval = 5 * time.Minute
	catalogRefreshInterval   = 24 * time.Hour

	resolveCacheFileName = "resolve_cache.json"
	catalogCacheFileName = "catalog_cache.json"
)

type resolveCacheEntry struct {
	Result    ResolveResult `json:"result"`
	FetchedAt time.Time     `json:"fetchedAt"`
	Degraded  bool          `json:"degraded"`
}

type catalogEntry struct {
	Name           string `json:"name"`
	HeaderImageURL string `json:"headerImageUrl"`
}

// store holds both caches behind one RWMutex per cache -- the resolve
// cache and catalog cache are unrelated in access pattern (per-request
// reads/writes vs. one full-map swap a day), so each gets its own lock
// rather than sharing contention for no reason.
type store struct {
	cacheDir string

	resolveMu    sync.RWMutex
	resolved     map[uint64]*resolveCacheEntry
	resolveOrder *list.List // front = oldest FetchedAt/refreshed, back = newest
	resolveElems map[uint64]*list.Element

	catalogMu sync.RWMutex
	catalog   map[int64]catalogEntry
}

func newStore(cacheDir string) (*store, error) {
	if err := os.MkdirAll(cacheDir, 0o755); err != nil {
		return nil, fmt.Errorf("create cache dir: %w", err)
	}
	s := &store{
		cacheDir:     cacheDir,
		resolved:     make(map[uint64]*resolveCacheEntry),
		resolveOrder: list.New(),
		resolveElems: make(map[uint64]*list.Element),
		catalog:      make(map[int64]catalogEntry),
	}
	s.loadResolveCache()
	s.loadCatalog()
	return s, nil
}

func (s *store) loadResolveCache() {
	path := filepath.Join(s.cacheDir, resolveCacheFileName)
	data, err := os.ReadFile(path)
	if err != nil {
		if !os.IsNotExist(err) {
			log.Printf("resolve cache: load failed, starting empty: %v", err)
		}
		return
	}
	var raw map[uint64]*resolveCacheEntry
	if err := json.Unmarshal(data, &raw); err != nil {
		log.Printf("resolve cache: corrupt snapshot, starting empty: %v", err)
		return
	}

	// Rebuild eviction order oldest-first by FetchedAt -- JSON object key
	// order isn't meaningful, so this is the one place we need an
	// explicit sort to recover genuine insertion-age ordering.
	ids := make([]uint64, 0, len(raw))
	now := time.Now()
	for id, entry := range raw {
		if now.Sub(entry.FetchedAt) >= entryTTL(entry) {
			continue // don't resurrect stale entries past TTL
		}
		ids = append(ids, id)
	}
	sort.Slice(ids, func(i, j int) bool {
		return raw[ids[i]].FetchedAt.Before(raw[ids[j]].FetchedAt)
	})

	s.resolveMu.Lock()
	defer s.resolveMu.Unlock()
	for _, id := range ids {
		s.resolved[id] = raw[id]
		s.resolveElems[id] = s.resolveOrder.PushBack(id)
	}
	log.Printf("resolve cache: loaded %d entries", len(ids))
}

func (s *store) loadCatalog() {
	path := filepath.Join(s.cacheDir, catalogCacheFileName)
	data, err := os.ReadFile(path)
	if err != nil {
		if !os.IsNotExist(err) {
			log.Printf("catalog cache: load failed, starting empty: %v", err)
		}
		return
	}
	var raw map[int64]catalogEntry
	if err := json.Unmarshal(data, &raw); err != nil {
		log.Printf("catalog cache: corrupt snapshot, starting empty: %v", err)
		return
	}
	s.catalogMu.Lock()
	s.catalog = raw
	s.catalogMu.Unlock()
	log.Printf("catalog cache: loaded %d apps", len(raw))
}

// entryTTL is shorter for entries resolved via the key-free fallback (see
// resolve.go's fetch) than for ones from the primary keyed endpoint.
func entryTTL(entry *resolveCacheEntry) time.Duration {
	if entry.Degraded {
		return degradedResolveCacheTTL
	}
	return resolveCacheTTL
}

// getResolve returns a cached result only if present and within TTL.
func (s *store) getResolve(id uint64) (ResolveResult, bool) {
	s.resolveMu.RLock()
	defer s.resolveMu.RUnlock()
	entry, ok := s.resolved[id]
	if !ok || time.Since(entry.FetchedAt) >= entryTTL(entry) {
		return ResolveResult{}, false
	}
	return entry.Result, true
}

// putResolve inserts or refreshes a cache entry, evicting the oldest entry
// whenever the cap is exceeded. degraded marks a result that came from the
// key-free fallback path rather than the primary keyed endpoint -- see
// entryTTL.
func (s *store) putResolve(id uint64, result ResolveResult, degraded bool) {
	s.resolveMu.Lock()
	defer s.resolveMu.Unlock()

	if elem, exists := s.resolveElems[id]; exists {
		s.resolveOrder.MoveToBack(elem)
	} else {
		s.resolveElems[id] = s.resolveOrder.PushBack(id)
	}
	s.resolved[id] = &resolveCacheEntry{Result: result, FetchedAt: time.Now(), Degraded: degraded}

	for len(s.resolved) > maxResolveCacheEntries {
		oldest := s.resolveOrder.Front()
		if oldest == nil {
			break
		}
		oldestID := oldest.Value.(uint64)
		s.resolveOrder.Remove(oldest)
		delete(s.resolveElems, oldestID)
		delete(s.resolved, oldestID)
	}
}

func (s *store) getCatalogEntry(appID int64) (catalogEntry, bool) {
	s.catalogMu.RLock()
	defer s.catalogMu.RUnlock()
	entry, ok := s.catalog[appID]
	return entry, ok
}

func (s *store) catalogSize() int {
	s.catalogMu.RLock()
	defer s.catalogMu.RUnlock()
	return len(s.catalog)
}

// replaceCatalog atomically swaps in a fully-populated map -- concurrent
// readers only ever see the old complete catalog or the new complete one,
// never a partially-refreshed one.
func (s *store) replaceCatalog(entries map[int64]catalogEntry) {
	s.catalogMu.Lock()
	s.catalog = entries
	s.catalogMu.Unlock()
}

func (s *store) saveResolveCache() error {
	s.resolveMu.RLock()
	snapshot := make(map[uint64]*resolveCacheEntry, len(s.resolved))
	for id, entry := range s.resolved {
		snapshot[id] = entry
	}
	s.resolveMu.RUnlock()
	return atomicWriteJSON(filepath.Join(s.cacheDir, resolveCacheFileName), snapshot)
}

func (s *store) saveCatalog() error {
	s.catalogMu.RLock()
	snapshot := s.catalog
	s.catalogMu.RUnlock()
	return atomicWriteJSON(filepath.Join(s.cacheDir, catalogCacheFileName), snapshot)
}

// flush persists both caches, best-effort -- called on shutdown. A lost
// cache write only costs extra Steam calls after restart, never real data
// loss, so callers should log failures here rather than treat them as fatal.
func (s *store) flush() error {
	errResolve := s.saveResolveCache()
	errCatalog := s.saveCatalog()
	if errResolve != nil {
		return errResolve
	}
	return errCatalog
}

// atomicWriteJSON writes v to path via a temp file in the same directory
// followed by a rename, so a crash or concurrent read never observes a
// half-written file. The temp file must share path's directory: os.Rename
// doesn't fall back across filesystems (EXDEV), and a different tmpdir
// could easily be a different filesystem.
func atomicWriteJSON(path string, v any) error {
	dir := filepath.Dir(path)
	tmp, err := os.CreateTemp(dir, ".tmp-*")
	if err != nil {
		return fmt.Errorf("create temp file: %w", err)
	}
	tmpPath := tmp.Name()
	defer os.Remove(tmpPath) // no-op once the rename below succeeds

	enc := json.NewEncoder(tmp)
	if err := enc.Encode(v); err != nil {
		tmp.Close()
		return fmt.Errorf("encode json: %w", err)
	}
	if err := tmp.Sync(); err != nil {
		tmp.Close()
		return fmt.Errorf("sync temp file: %w", err)
	}
	if err := tmp.Close(); err != nil {
		return fmt.Errorf("close temp file: %w", err)
	}
	if err := os.Rename(tmpPath, path); err != nil {
		return fmt.Errorf("rename into place: %w", err)
	}
	return nil
}

// refreshCatalog walks the full Steam app catalog and atomically replaces
// the cached one. Called on startup (if the catalog is empty) and on the
// 24h ticker started by startCacheTickers.
func refreshCatalog(ctx context.Context, s *store, steam *SteamClient) error {
	apps, err := steam.GetAppList(ctx)
	if err != nil {
		return fmt.Errorf("fetch app list: %w", err)
	}
	entries := make(map[int64]catalogEntry, len(apps))
	for _, app := range apps {
		entries[app.AppID] = catalogEntry{
			Name:           app.Name,
			HeaderImageURL: steamCDNImageURL(app.AppID),
		}
	}
	s.replaceCatalog(entries)
	if err := s.saveCatalog(); err != nil {
		return fmt.Errorf("save catalog: %w", err)
	}
	log.Printf("catalog cache: refreshed, %d apps", len(entries))
	return nil
}

// startCacheTickers runs the periodic resolve-cache save and the 24h
// catalog refresh for the lifetime of ctx. Both run in their own
// goroutine; callers don't need to wait on them, they stop when ctx is
// cancelled.
func startCacheTickers(ctx context.Context, s *store, steam *SteamClient) {
	if s.catalogSize() == 0 {
		go func() {
			if err := refreshCatalog(ctx, s, steam); err != nil {
				log.Printf("catalog cache: initial refresh failed: %v", err)
			}
		}()
	}

	go func() {
		ticker := time.NewTicker(resolveCacheSaveInterval)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if err := s.saveResolveCache(); err != nil {
					log.Printf("resolve cache: periodic save failed: %v", err)
				}
			}
		}
	}()

	go func() {
		ticker := time.NewTicker(catalogRefreshInterval)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if err := refreshCatalog(ctx, s, steam); err != nil {
					log.Printf("catalog cache: refresh failed: %v", err)
				}
			}
		}
	}()
}
