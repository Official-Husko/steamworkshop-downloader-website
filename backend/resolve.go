package main

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"strings"
	"sync"
	"time"

	"golang.org/x/sync/singleflight"
)

// fetchTimeout bounds the shared Steam fetch started by resolveAndCache --
// deliberately independent of any single caller's request context (see
// Resolve), so one client disconnecting can't cut a fetch short for every
// other client waiting on the same id.
const fetchTimeout = 15 * time.Second

// resolver ties the Steam client and cache together for a single logical
// operation: turn a published file id into a ResolveResult. Nothing
// outside this file sees raw Steam JSON -- steamapi.go's wire types stay
// internal to the fetch/build path here.
type resolver struct {
	steam *SteamClient
	store *store
	sf    singleflight.Group
}

func newResolver(steam *SteamClient, s *store) *resolver {
	return &resolver{steam: steam, store: s}
}

// Resolve returns a cached result if one is still within TTL, otherwise
// fetches fresh from Steam and caches the outcome (including negative
// outcomes -- not-found/removed/private are cached too, so repeated
// garbage lookups don't re-hit Steam).
//
// Concurrent Resolve calls for the *same* id are coalesced via
// singleflight: without this, several people opening the same
// freshly-shared link at once each independently missed the cache and
// fired their own Steam calls, queueing behind each other on the outbound
// rate limiter (confirmed empirically: concurrent cold requests for one
// collection id took 10+ seconds under load). Now only one of them
// actually fetches; the rest wait on that single result.
func (r *resolver) Resolve(ctx context.Context, id uint64) (ResolveResult, error) {
	if cached, ok := r.store.getResolve(id); ok {
		return cached, nil
	}

	key := strconv.FormatUint(id, 10)
	ch := r.sf.DoChan(key, func() (any, error) {
		return r.resolveAndCache(id)
	})

	select {
	case res := <-ch:
		if res.Err != nil {
			return ResolveResult{}, res.Err
		}
		return res.Val.(ResolveResult), nil
	case <-ctx.Done():
		return ResolveResult{}, ctx.Err()
	}
}

// resolveAndCache does the actual Steam fetch and cache write. Runs at
// most once per id at a time (see Resolve's singleflight.DoChan) on its
// own bounded, caller-independent context.
func (r *resolver) resolveAndCache(id uint64) (ResolveResult, error) {
	// Re-check: another goroutine may have completed a fetch for this id
	// and populated the cache between Resolve's first check and this
	// call actually winning the singleflight slot.
	if cached, ok := r.store.getResolve(id); ok {
		return cached, nil
	}

	start := time.Now()
	ctx, cancel := context.WithTimeout(context.Background(), fetchTimeout)
	defer cancel()

	result, degraded, err := r.fetch(ctx, id)
	if err != nil {
		return ResolveResult{}, err
	}
	if result.Kind == "item" && result.Item != nil {
		result.Item.ResolveMs = time.Since(start).Milliseconds()
	}

	r.store.putResolve(id, result, degraded)
	return result, nil
}

// fetch tries the keyed GetDetails endpoint first (real votes, real
// app_name, a reliable file_type-based collection signal, in one call
// instead of two) and falls back to the key-free ISteamRemoteStorage pair
// on any failure -- network error, non-200, decode failure, or the
// caller's own context deadline. A fallback isn't necessarily quota
// exhaustion specifically (Steam doesn't expose a clean signal to tell
// that apart from a transient blip), but either way the result is marked
// degraded so cache.go gives it a shorter TTL and it's retried against the
// richer endpoint sooner rather than sitting on stale partial data for the
// full 24h.
func (r *resolver) fetch(ctx context.Context, id uint64) (result ResolveResult, degraded bool, err error) {
	result, err = r.fetchViaDetails(ctx, id)
	if err == nil {
		return result, false, nil
	}
	log.Printf("resolve %d: keyed GetDetails failed (%v), falling back to key-free", id, err)

	result, err = r.fetchViaLegacy(ctx, id)
	if err != nil {
		return ResolveResult{}, false, err
	}
	return result, true, nil
}

// fetchViaDetails is the primary path: one keyed IPublishedFileService/GetDetails
// call carries metadata, votes, and (for a collection) the children list
// together -- file_type == steamFileTypeCollection is the confirmed-live
// signal for which DTO to build, no second disambiguation call needed.
func (r *resolver) fetchViaDetails(ctx context.Context, id uint64) (ResolveResult, error) {
	results, err := r.steam.GetDetailsBatch(ctx, []uint64{id})
	if err != nil {
		return ResolveResult{}, fmt.Errorf("get details: %w", err)
	}
	if len(results) != 1 {
		return ResolveResult{}, fmt.Errorf("GetDetails: expected 1 result, got %d", len(results))
	}
	d := results[0]
	idStr := strconv.FormatUint(id, 10)

	if d.Result != 1 {
		// Private and truly-nonexistent items still look identical here
		// for a non-owner caller -- best-effort "not-found", not a guess.
		return ResolveResult{Kind: "not-found", ID: idStr}, nil
	}
	if d.Banned {
		return ResolveResult{Kind: "removed", ID: idStr, Title: d.Title}, nil
	}
	if d.Visibility != 0 {
		return ResolveResult{Kind: "private", ID: idStr, Title: d.Title}, nil
	}
	if d.FileType == steamFileTypeCollection {
		dto, err := r.buildCollectionDTOFromUGC(ctx, id, &d)
		if err != nil {
			return ResolveResult{}, err
		}
		return ResolveResult{Kind: "collection", Collection: dto}, nil
	}
	return ResolveResult{Kind: "item", Item: r.buildItemDTOFromUGC(&d)}, nil
}

// fetchViaLegacy is the key-free fallback: both GetPublishedFileDetails and
// GetCollectionDetails are called for every attempt -- confirmed
// empirically that the key-free details endpoint alone carries no signal
// distinguishing a regular item from a collection, so GetCollectionDetails
// is the only reliable way to tell: result 1 with children means
// collection, result 9 means item. Lacks vote_data and a real app_name --
// see fetchViaDetails for the primary, richer path.
func (r *resolver) fetchViaLegacy(ctx context.Context, id uint64) (ResolveResult, error) {
	var details *steamPublishedFileDetails
	var coll *steamCollectionDetails
	var detailsErr, collErr error

	var wg sync.WaitGroup
	wg.Add(2)
	go func() {
		defer wg.Done()
		details, detailsErr = r.steam.GetPublishedFileDetails(ctx, id)
	}()
	go func() {
		defer wg.Done()
		coll, collErr = r.steam.GetCollectionDetails(ctx, id)
	}()
	wg.Wait()

	if detailsErr != nil {
		return ResolveResult{}, fmt.Errorf("get published file details: %w", detailsErr)
	}
	if collErr != nil {
		return ResolveResult{}, fmt.Errorf("get collection details: %w", collErr)
	}

	idStr := strconv.FormatUint(id, 10)

	if coll.Result == 1 && len(coll.Children) > 0 {
		dto, err := r.buildCollectionDTO(ctx, id, details, coll)
		if err != nil {
			return ResolveResult{}, err
		}
		return ResolveResult{Kind: "collection", Collection: dto}, nil
	}

	if details.Result != 1 {
		// Legacy endpoint gives no further signal for a non-owner caller
		// here -- private and truly-nonexistent items look identical, so
		// this is a best-effort "not-found" rather than a guess.
		return ResolveResult{Kind: "not-found", ID: idStr}, nil
	}
	if details.Banned != 0 {
		return ResolveResult{Kind: "removed", ID: idStr, Title: details.Title}, nil
	}
	if details.Visibility != 0 {
		return ResolveResult{Kind: "private", ID: idStr, Title: details.Title}, nil
	}

	return ResolveResult{Kind: "item", Item: r.buildItemDTO(details)}, nil
}

// safeHTTPURL only passes through http(s) URLs -- Steam has always
// returned https://images.steamusercontent.com/... for preview_url in
// testing, but this is user-influenced data, so it gets the same
// scheme allowlist as the frontend's own BBCode link/image handling
// rather than being trusted blindly.
func safeHTTPURL(raw string) string {
	if strings.HasPrefix(raw, "http://") || strings.HasPrefix(raw, "https://") {
		return raw
	}
	return ""
}

func (r *resolver) buildItemDTO(details *steamPublishedFileDetails) *WorkshopItemDTO {
	tags := make([]string, 0, len(details.Tags))
	for _, t := range details.Tags {
		tags = append(tags, t.Tag)
	}
	sizeBytes, _ := strconv.ParseInt(details.FileSize, 10, 64)

	return &WorkshopItemDTO{
		ID:                 details.PublishedFileID,
		Title:              details.Title,
		Owner:              details.Creator,
		Game:               r.gameName(details.ConsumerAppID),
		AppID:              strconv.FormatInt(details.ConsumerAppID, 10),
		FileType:           "COMMUNITY",
		PreviewURL:         safeHTTPURL(details.PreviewURL),
		SizeBytes:          sizeBytes,
		CreatedAt:          unixToDate(details.TimeCreated),
		UpdatedAt:          unixToDate(details.TimeUpdated),
		VotesUp:            details.VoteData.VotesUp,
		VotesDown:          details.VoteData.VotesDown,
		NumChildren:        0,
		Visibility:         "PUBLIC",
		Banned:             false,
		Subscriptions:      details.Subscriptions,
		Favorites:          details.Favorited,
		Views:              details.Views,
		Tags:               tags,
		DescriptionIntro:   details.Description,
		DescriptionBullets: []string{},
		ChangelogCount:     0,
		Status:             "ok",
	}
}

// buildCollectionDTO batch-resolves every child's own details (title,
// size, banned/visibility) rather than looping one request per child --
// keeps latency and outbound-limiter pressure bounded even for a
// large collection.
func (r *resolver) buildCollectionDTO(ctx context.Context, id uint64, details *steamPublishedFileDetails, coll *steamCollectionDetails) (*WorkshopCollectionDTO, error) {
	children := make([]CollectionChildDTO, len(coll.Children))
	ids := make([]uint64, 0, len(coll.Children))
	indexByID := make(map[uint64]int, len(coll.Children))
	for i, c := range coll.Children {
		// Default every slot to "removed" up front; anything we can't
		// parse or fails to come back from Steam keeps this default
		// rather than silently vanishing from the list.
		children[i] = CollectionChildDTO{ID: c.PublishedFileID, Status: "removed"}
		cid, ok := parsePublishedFileID(c.PublishedFileID)
		if !ok {
			continue
		}
		ids = append(ids, cid)
		indexByID[cid] = i
	}

	resultsByID := make(map[uint64]steamPublishedFileDetails, len(ids))
	for start := 0; start < len(ids); start += steamBatchSize {
		end := start + steamBatchSize
		if end > len(ids) {
			end = len(ids)
		}
		batch, err := r.steam.GetPublishedFileDetailsBatch(ctx, ids[start:end])
		if err != nil {
			return nil, fmt.Errorf("resolve collection children: %w", err)
		}
		for _, d := range batch {
			cid, ok := parsePublishedFileID(d.PublishedFileID)
			if !ok {
				continue
			}
			resultsByID[cid] = d
		}
	}

	for cid, idx := range indexByID {
		d, ok := resultsByID[cid]
		if !ok || d.Result != 1 {
			continue // already defaulted to "removed" above
		}
		child := CollectionChildDTO{ID: d.PublishedFileID, Title: d.Title}
		switch {
		case d.Banned != 0:
			child.Status = "removed"
		case d.Visibility != 0:
			child.Status = "private"
		default:
			child.Status = "ok"
			if size, err := strconv.ParseInt(d.FileSize, 10, 64); err == nil {
				child.SizeBytes = &size
			}
		}
		children[idx] = child
	}

	var title, owner, game, updatedAt string
	if details.Result == 1 {
		title = details.Title
		owner = details.Creator
		game = r.gameName(details.ConsumerAppID)
		updatedAt = unixToDate(details.TimeUpdated)
	}

	return &WorkshopCollectionDTO{
		ID:          strconv.FormatUint(id, 10),
		Title:       title,
		Owner:       owner,
		Game:        game,
		UpdatedAt:   updatedAt,
		NumChildren: len(children),
		Children:    children,
		Status:      "ok",
	}, nil
}

// buildItemDTOFromUGC maps the primary, keyed GetDetails response --
// unlike buildItemDTO's legacy source, this one actually carries
// vote_data and a real app_name.
func (r *resolver) buildItemDTOFromUGC(d *steamUGCDetails) *WorkshopItemDTO {
	tags := make([]string, 0, len(d.Tags))
	for _, t := range d.Tags {
		tags = append(tags, t.Tag)
	}
	sizeBytes, _ := strconv.ParseInt(d.FileSize, 10, 64)

	game := d.AppName
	if game == "" {
		game = r.gameName(d.ConsumerAppID)
	}

	return &WorkshopItemDTO{
		ID:                 d.PublishedFileID,
		Title:              d.Title,
		Owner:              d.Creator,
		Game:               game,
		AppID:              strconv.FormatInt(d.ConsumerAppID, 10),
		FileType:           "COMMUNITY",
		PreviewURL:         safeHTTPURL(d.PreviewURL),
		SizeBytes:          sizeBytes,
		CreatedAt:          unixToDate(d.TimeCreated),
		UpdatedAt:          unixToDate(d.TimeUpdated),
		VotesUp:            d.VoteData.VotesUp,
		VotesDown:          d.VoteData.VotesDown,
		NumChildren:        0,
		Visibility:         "PUBLIC",
		Banned:             false,
		Subscriptions:      d.Subscriptions,
		Favorites:          d.Favorited,
		Views:              d.Views,
		Tags:               tags,
		DescriptionIntro:   d.FileDescription,
		DescriptionBullets: []string{},
		ChangelogCount:     0,
		Status:             "ok",
	}
}

// buildCollectionDTOFromUGC mirrors buildCollectionDTO's batching approach
// but resolves children via the same keyed GetDetailsBatch used for the
// parent -- if the parent call succeeded, a children-batch failure here
// fails fetchViaDetails as a whole rather than mixing a keyed parent with
// a key-free children fallback; the top-level fetch() dispatcher then
// retries the entire resolve (parent + children) via fetchViaLegacy.
func (r *resolver) buildCollectionDTOFromUGC(ctx context.Context, id uint64, d *steamUGCDetails) (*WorkshopCollectionDTO, error) {
	children := make([]CollectionChildDTO, len(d.Children))
	ids := make([]uint64, 0, len(d.Children))
	indexByID := make(map[uint64]int, len(d.Children))
	for i, c := range d.Children {
		children[i] = CollectionChildDTO{ID: c.PublishedFileID, Status: "removed"}
		cid, ok := parsePublishedFileID(c.PublishedFileID)
		if !ok {
			continue
		}
		ids = append(ids, cid)
		indexByID[cid] = i
	}

	for start := 0; start < len(ids); start += steamDetailsBatchSize {
		end := start + steamDetailsBatchSize
		if end > len(ids) {
			end = len(ids)
		}
		batch, err := r.steam.GetDetailsBatch(ctx, ids[start:end])
		if err != nil {
			return nil, fmt.Errorf("resolve collection children: %w", err)
		}
		for _, cd := range batch {
			cid, ok := parsePublishedFileID(cd.PublishedFileID)
			if !ok || cd.Result != 1 {
				continue // already defaulted to "removed" above
			}
			idx, tracked := indexByID[cid]
			if !tracked {
				continue
			}
			child := CollectionChildDTO{ID: cd.PublishedFileID, Title: cd.Title}
			switch {
			case cd.Banned:
				child.Status = "removed"
			case cd.Visibility != 0:
				child.Status = "private"
			default:
				child.Status = "ok"
				if size, err := strconv.ParseInt(cd.FileSize, 10, 64); err == nil {
					child.SizeBytes = &size
				}
			}
			children[idx] = child
		}
	}

	game := d.AppName
	if game == "" {
		game = r.gameName(d.ConsumerAppID)
	}

	return &WorkshopCollectionDTO{
		ID:          strconv.FormatUint(id, 10),
		Title:       d.Title,
		Owner:       d.Creator,
		Game:        game,
		UpdatedAt:   unixToDate(d.TimeUpdated),
		NumChildren: len(children),
		Children:    children,
		Status:      "ok",
	}, nil
}

func (r *resolver) gameName(appID int64) string {
	if entry, ok := r.store.getCatalogEntry(appID); ok && entry.Name != "" {
		return entry.Name
	}
	return strconv.FormatInt(appID, 10)
}

func unixToDate(ts int64) string {
	if ts <= 0 {
		return ""
	}
	return time.Unix(ts, 0).UTC().Format("2006-01-02")
}
