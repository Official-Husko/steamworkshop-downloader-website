package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"golang.org/x/time/rate"
)

const (
	steamAPIBase        = "https://api.steampowered.com"
	steamRequestTimeout = 10 * time.Second
	steamMaxBodyBytes   = 4 << 20 // 4 MiB -- generous for a large collection's children, caps a broken/hostile upstream
	// GetAppList at max_results=50000 legitimately runs close to the 4 MiB
	// cap above (confirmed live: a full page truncated mid-JSON under it) --
	// this endpoint gets its own, larger ceiling rather than raising the
	// shared one and loosening the bound on every other call.
	steamCatalogMaxBodyBytes = 32 << 20 // 32 MiB
	steamUserAgent           = "modrelay-backend/1.0 (+https://workshop.lonewolves.dev)"
	steamBatchSize           = 100 // cap on publishedfileids per request; larger collections are split into sequential batches
	// GetDetails is a GET request, so the batch size is capped lower than
	// the POST-form endpoints above -- keeps the query string comfortably
	// under typical server/proxy URL-length limits rather than chasing
	// exactly how large is still safe.
	steamDetailsBatchSize = 50
)

// SteamClient talks to Steam's Web API. Every method is safe for concurrent
// use: the underlying http.Client is stateless beyond connection pooling,
// and rate.Limiter is documented safe for concurrent use by construction.
type SteamClient struct {
	httpClient *http.Client
	apiKey     string

	// Three limiters: the key-free ISteamRemoteStorage calls (used as the
	// fallback path, see resolve.go) are throttled per-source-IP; the
	// keyed IStoreService call (GetAppList, ~4 calls/day) and the keyed
	// IPublishedFileService call (GetDetails, the primary per-resolve
	// path, so far higher volume) both draw against the same daily
	// per-key quota but at very different rates -- sharing one limiter
	// tuned for either would either starve resolve latency or let the
	// rare catalog walk burst too aggressively.
	unauthedLimiter *rate.Limiter
	storeLimiter    *rate.Limiter
	detailsLimiter  *rate.Limiter
}

func NewSteamClient(apiKey string) *SteamClient {
	return &SteamClient{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: steamRequestTimeout,
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				return http.ErrUseLastResponse
			},
		},
		// ~5 req/s sustained, small burst -- comfortably under Steam's
		// informal per-IP ceilings for the unauthenticated storage
		// endpoints, while keeping resolve latency low under concurrent
		// load (each fresh resolve costs at least 2 of these calls).
		unauthedLimiter: rate.NewLimiter(rate.Limit(5), 10),
		// The full catalog walk only needs ~4 calls once every 24h --
		// this bounds worst-case burst, it's not chasing a real ceiling.
		storeLimiter: rate.NewLimiter(rate.Limit(1), 2),
		// Slightly more conservative than unauthedLimiter -- this is now
		// the primary per-resolve path and draws against the shared
		// daily key quota (unlike the key-free calls), so it's worth
		// smoothing bursts a bit harder even though the real constraint
		// is the daily count, not the per-second rate.
		detailsLimiter: rate.NewLimiter(rate.Limit(4), 8),
	}
}

// do executes req after waiting on limiter, with a bounded body read (cap
// depends on the call site, see maxBody) and no redirect following
// (defense-in-depth even against a hardcoded host).
func (c *SteamClient) do(ctx context.Context, limiter *rate.Limiter, req *http.Request, maxBody int64) ([]byte, error) {
	if err := limiter.Wait(ctx); err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", steamUserAgent)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, maxBody))
	if err != nil {
		return nil, fmt.Errorf("read steam response body: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("steam api %s: unexpected status %d", req.URL.Path, resp.StatusCode)
	}
	return body, nil
}

func (c *SteamClient) postForm(ctx context.Context, limiter *rate.Limiter, path string, form url.Values) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, steamAPIBase+path, strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	return c.do(ctx, limiter, req, steamMaxBodyBytes)
}

// steamPublishedFileDetails mirrors the full ISteamRemoteStorage response
// shape (confirmed live against real items) -- captured in full even
// though resolve.go doesn't map every field into our own DTOs yet, so nothing
// Steam actually sends is silently discarded before we've decided whether we
// want it. file_size/hcontent_file/hcontent_preview arrive as JSON strings,
// not numbers -- Steam does this for several large-integer fields to dodge
// JS float precision, so they must stay string-typed here or Unmarshal fails
// outright. vote_data is absent from real responses seen so far (not just
// zero-valued -- the key doesn't appear at all), so VotesUp/VotesDown
// currently read 0 for every real item; left in place since it may be
// populated for items where voting is enabled.
type steamPublishedFileDetails struct {
	Result             int    `json:"result"`
	PublishedFileID    string `json:"publishedfileid"`
	Creator            string `json:"creator"`
	CreatorAppID       int64  `json:"creator_app_id"`
	ConsumerAppID      int64  `json:"consumer_app_id"`
	Filename           string `json:"filename"`
	FileSize           string `json:"file_size"`
	FileURL            string `json:"file_url"`
	HContentFile       string `json:"hcontent_file"`
	PreviewURL         string `json:"preview_url"`
	HContentPreview    string `json:"hcontent_preview"`
	Title              string `json:"title"`
	Description        string `json:"description"`
	TimeCreated        int64  `json:"time_created"`
	TimeUpdated        int64  `json:"time_updated"`
	Visibility         int    `json:"visibility"`
	Banned             int    `json:"banned"`
	BanReason          string `json:"ban_reason"`
	Subscriptions      int64  `json:"subscriptions"`
	Favorited          int64  `json:"favorited"`
	LifetimeSubscribed int64  `json:"lifetime_subscriptions"`
	LifetimeFavorited  int64  `json:"lifetime_favorited"`
	Views              int64  `json:"views"`
	Tags               []struct {
		Tag string `json:"tag"`
	} `json:"tags"`
	VoteData struct {
		VotesUp   int64 `json:"votes_up"`
		VotesDown int64 `json:"votes_down"`
	} `json:"vote_data"`
}

type getPublishedFileDetailsResponse struct {
	Response struct {
		Result               int                         `json:"result"`
		ResultCount          int                         `json:"resultcount"`
		PublishedFileDetails []steamPublishedFileDetails `json:"publishedfiledetails"`
	} `json:"response"`
}

// GetPublishedFileDetails fetches metadata for a single published file.
// Key-free, confirmed live. Both regular items and collections return a
// result here -- this alone cannot distinguish the two, see
// GetCollectionDetails and resolve.go.
func (c *SteamClient) GetPublishedFileDetails(ctx context.Context, id uint64) (*steamPublishedFileDetails, error) {
	results, err := c.GetPublishedFileDetailsBatch(ctx, []uint64{id})
	if err != nil {
		return nil, err
	}
	if len(results) != 1 {
		return nil, fmt.Errorf("GetPublishedFileDetails: expected 1 result, got %d", len(results))
	}
	return &results[0], nil
}

// GetPublishedFileDetailsBatch resolves up to steamBatchSize ids in one
// call -- used both for single-item resolves and for batch-resolving a
// collection's children, rather than one request per child.
func (c *SteamClient) GetPublishedFileDetailsBatch(ctx context.Context, ids []uint64) ([]steamPublishedFileDetails, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	if len(ids) > steamBatchSize {
		return nil, fmt.Errorf("GetPublishedFileDetailsBatch: batch too large (%d > %d)", len(ids), steamBatchSize)
	}
	form := url.Values{"itemcount": {strconv.Itoa(len(ids))}}
	for i, id := range ids {
		form.Set(fmt.Sprintf("publishedfileids[%d]", i), strconv.FormatUint(id, 10))
	}
	body, err := c.postForm(ctx, c.unauthedLimiter, "/ISteamRemoteStorage/GetPublishedFileDetails/v1/", form)
	if err != nil {
		return nil, err
	}
	var parsed getPublishedFileDetailsResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, fmt.Errorf("decode GetPublishedFileDetails: %w", err)
	}
	return parsed.Response.PublishedFileDetails, nil
}

// steamUGCDetails mirrors the full IPublishedFileService/GetDetails
// response shape (confirmed live against a real item and a real 42-child
// collection, with includevotes/includetags/includechildren=true). This is
// the *primary* metadata source (see resolve.go) -- keyed, but it's the
// only endpoint that actually returns vote_data populated, a real
// app_name, and a reliable file_type (2 == collection, confirmed live;
// everything else has been 0 == community in testing so far). Field naming
// genuinely differs from steamPublishedFileDetails's ISteamRemoteStorage
// shape (e.g. "creator_appid" here vs "creator_app_id" there, "file_description"
// here vs "description" there) -- these are two separate Steam API
// families with inconsistent conventions, not a typo.
type steamUGCDetails struct {
	Result             int    `json:"result"`
	PublishedFileID    string `json:"publishedfileid"`
	Creator            string `json:"creator"`
	CreatorAppID       int64  `json:"creator_appid"`
	ConsumerAppID      int64  `json:"consumer_appid"`
	Filename           string `json:"filename"`
	FileSize           string `json:"file_size"`
	PreviewFileSize    string `json:"preview_file_size"`
	PreviewURL         string `json:"preview_url"`
	HContentFile       string `json:"hcontent_file"`
	HContentPreview    string `json:"hcontent_preview"`
	Title              string `json:"title"`
	FileDescription    string `json:"file_description"`
	TimeCreated        int64  `json:"time_created"`
	TimeUpdated        int64  `json:"time_updated"`
	Visibility         int    `json:"visibility"`
	Banned             bool   `json:"banned"`
	BanReason          string `json:"ban_reason"`
	AppName            string `json:"app_name"`
	FileType           int    `json:"file_type"`
	Subscriptions      int64  `json:"subscriptions"`
	Favorited          int64  `json:"favorited"`
	LifetimeSubscribed int64  `json:"lifetime_subscriptions"`
	LifetimeFavorited  int64  `json:"lifetime_favorited"`
	Views              int64  `json:"views"`
	NumChildren        int64  `json:"num_children"`
	NumCommentsPublic  int64  `json:"num_comments_public"`
	Tags               []struct {
		Tag         string `json:"tag"`
		DisplayName string `json:"display_name"`
	} `json:"tags"`
	VoteData struct {
		Score     float64 `json:"score"`
		VotesUp   int64   `json:"votes_up"`
		VotesDown int64   `json:"votes_down"`
	} `json:"vote_data"`
	// Only present with includechildren=true, and only non-empty for an
	// actual collection. Doesn't carry each child's own title/size --
	// still need a follow-up batch call for that, same as the fallback
	// path.
	Children []struct {
		PublishedFileID string `json:"publishedfileid"`
		SortOrder       int    `json:"sortorder"`
		FileType        int    `json:"file_type"`
	} `json:"children"`
}

type getDetailsResponse struct {
	Response struct {
		PublishedFileDetails []steamUGCDetails `json:"publishedfiledetails"`
	} `json:"response"`
}

// steamFileTypeCollection is the confirmed-live file_type value for a
// Workshop collection (steamUGCDetails.FileType). Everything else seen in
// testing so far has been 0 (community item).
const steamFileTypeCollection = 2

// GetDetailsBatch is the primary metadata source for a fresh resolve (see
// resolve.go) -- keyed, GET, returns vote_data/app_name/file_type/children
// in one call where the key-free pair needs two calls and still lacks
// votes. Falls back to the key-free GetPublishedFileDetails +
// GetCollectionDetails pair on any failure (network, non-200, decode, or
// the caller's own context deadline) -- resolve.go treats that fallback as
// a signal the daily key quota may be under pressure, not just a random
// blip, and caches the result with a shorter TTL so it's retried against
// this richer endpoint sooner.
func (c *SteamClient) GetDetailsBatch(ctx context.Context, ids []uint64) ([]steamUGCDetails, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	if len(ids) > steamDetailsBatchSize {
		return nil, fmt.Errorf("GetDetailsBatch: batch too large (%d > %d)", len(ids), steamDetailsBatchSize)
	}
	if c.apiKey == "" {
		return nil, fmt.Errorf("GetDetailsBatch: STEAM_API_KEY not configured")
	}
	q := url.Values{
		"key":                       {c.apiKey},
		"includevotes":              {"true"},
		"includetags":               {"true"},
		"includechildren":           {"true"},
		"includeadditionalpreviews": {"false"},
	}
	for i, id := range ids {
		q.Set(fmt.Sprintf("publishedfileids[%d]", i), strconv.FormatUint(id, 10))
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, steamAPIBase+"/IPublishedFileService/GetDetails/v1/?"+q.Encode(), nil)
	if err != nil {
		return nil, err
	}
	body, err := c.do(ctx, c.detailsLimiter, req, steamMaxBodyBytes)
	if err != nil {
		return nil, err
	}
	var parsed getDetailsResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, fmt.Errorf("decode GetDetails: %w", err)
	}
	return parsed.Response.PublishedFileDetails, nil
}

type steamCollectionChild struct {
	PublishedFileID string `json:"publishedfileid"`
	SortOrder       int    `json:"sortorder"`
}

type steamCollectionDetails struct {
	PublishedFileID string                 `json:"publishedfileid"`
	Result          int                    `json:"result"`
	Children        []steamCollectionChild `json:"children"`
}

type getCollectionDetailsResponse struct {
	Response struct {
		Result            int                      `json:"result"`
		ResultCount       int                      `json:"resultcount"`
		CollectionDetails []steamCollectionDetails `json:"collectiondetails"`
	} `json:"response"`
}

// GetCollectionDetails is the disambiguation call: result 1 with a
// populated Children slice means id is a collection, result 9 means it's a
// regular item. Called for every fresh resolve (see resolve.go) since the
// key-free GetPublishedFileDetails response carries no type signal at all
// -- confirmed empirically, not assumed from docs.
func (c *SteamClient) GetCollectionDetails(ctx context.Context, id uint64) (*steamCollectionDetails, error) {
	form := url.Values{
		"collectioncount":     {"1"},
		"publishedfileids[0]": {strconv.FormatUint(id, 10)},
	}
	body, err := c.postForm(ctx, c.unauthedLimiter, "/ISteamRemoteStorage/GetCollectionDetails/v1/", form)
	if err != nil {
		return nil, err
	}
	var parsed getCollectionDetailsResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, fmt.Errorf("decode GetCollectionDetails: %w", err)
	}
	if len(parsed.Response.CollectionDetails) != 1 {
		return nil, fmt.Errorf("GetCollectionDetails: expected 1 result, got %d", len(parsed.Response.CollectionDetails))
	}
	return &parsed.Response.CollectionDetails[0], nil
}

type steamStoreApp struct {
	AppID int64  `json:"appid"`
	Name  string `json:"name"`
}

type getAppListResponse struct {
	Response struct {
		Apps            []steamStoreApp `json:"apps"`
		HaveMoreResults bool            `json:"have_more_results"`
		LastAppID       int64           `json:"last_appid"`
	} `json:"response"`
}

// GetAppList walks the full Steam catalog via the keyed IStoreService
// replacement for the dead ISteamApps/GetAppList. max_results=50000 means
// the whole ~190k-app catalog costs only ~4 calls. Requires apiKey --
// callers should treat an empty key as "catalog refresh unavailable" and
// keep serving whatever's already cached, not fail resolve entirely.
func (c *SteamClient) GetAppList(ctx context.Context) ([]steamStoreApp, error) {
	if c.apiKey == "" {
		return nil, fmt.Errorf("GetAppList: STEAM_API_KEY not configured")
	}
	var all []steamStoreApp
	lastAppID := int64(0)
	for {
		q := url.Values{
			"key":           {c.apiKey},
			"include_games": {"true"},
			"max_results":   {"50000"},
		}
		if lastAppID > 0 {
			q.Set("last_appid", strconv.FormatInt(lastAppID, 10))
		}
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, steamAPIBase+"/IStoreService/GetAppList/v1/?"+q.Encode(), nil)
		if err != nil {
			return nil, err
		}
		body, err := c.do(ctx, c.storeLimiter, req, steamCatalogMaxBodyBytes)
		if err != nil {
			return nil, err
		}
		var parsed getAppListResponse
		if err := json.Unmarshal(body, &parsed); err != nil {
			return nil, fmt.Errorf("decode GetAppList: %w", err)
		}
		all = append(all, parsed.Response.Apps...)
		if !parsed.Response.HaveMoreResults || parsed.Response.LastAppID <= lastAppID {
			break
		}
		lastAppID = parsed.Response.LastAppID
	}
	return all, nil
}

// steamCDNImageURL constructs the header-image URL for an appid. Publicly
// hotlinkable, confirmed live -- no separate API call or image re-hosting
// needed.
func steamCDNImageURL(appID int64) string {
	return fmt.Sprintf("https://cdn.cloudflare.steamstatic.com/steam/apps/%d/header.jpg", appID)
}
