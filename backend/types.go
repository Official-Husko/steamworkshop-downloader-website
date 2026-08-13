package main

// Response DTOs for GET /api/v1/items/{id}, mirroring the frontend's
// Resolved tagged union (src/data/items.ts) as closely as Steam's key-free
// API honestly allows. Documented gaps versus the mock data, since the real
// API doesn't have a free equivalent for these:
//   - Owner is a raw SteamID64, not a display name (GetPlayerSummaries
//     needs a key and was explicitly ruled out -- no profile data needed).
//   - DescriptionHeading/Bullets/Outro are always empty: Steam gives one
//     raw description blob per item, stored in DescriptionIntro whole.
//   - ChangelogCount is always 0: no free endpoint exposes changelog data.
//   - Dependencies/RequiresDlc are always omitted: no confirmed free
//     mapping from Steam's response to these.
//   - Visibility will realistically almost always read "PUBLIC": Steam's
//     legacy GetPublishedFileDetails doesn't reliably distinguish a private
//     item from one that doesn't exist at all, for a non-owner caller --
//     both come back the same way. See resolve.go for how that's handled.
type WorkshopItemDTO struct {
	ID                 string   `json:"id"`
	Title              string   `json:"title"`
	Owner              string   `json:"owner"`
	Game               string   `json:"game"`
	AppID              string   `json:"appId"`
	FileType           string   `json:"fileType"`
	PreviewURL         string   `json:"previewUrl,omitempty"`
	SizeBytes          int64    `json:"sizeBytes"`
	CreatedAt          string   `json:"createdAt"`
	UpdatedAt          string   `json:"updatedAt"`
	VotesUp            int64    `json:"votesUp"`
	VotesDown          int64    `json:"votesDown"`
	NumChildren        int      `json:"numChildren"`
	Visibility         string   `json:"visibility"`
	Banned             bool     `json:"banned"`
	Subscriptions      int64    `json:"subscriptions"`
	Favorites          int64    `json:"favorites"`
	Views              int64    `json:"views"`
	Tags               []string `json:"tags"`
	DescriptionHeading string   `json:"descriptionHeading"`
	DescriptionIntro   string   `json:"descriptionIntro"`
	DescriptionBullets []string `json:"descriptionBullets"`
	DescriptionOutro   string   `json:"descriptionOutro"`
	RequiresDlc        string   `json:"requiresDlc,omitempty"`
	Dependencies       []string `json:"dependencies,omitempty"`
	ChangelogCount     int      `json:"changelogCount"`
	ResolveMs          int64    `json:"resolveMs"`
	Status             string   `json:"status"`
}

type CollectionChildDTO struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	SizeBytes *int64 `json:"sizeBytes,omitempty"`
	Status    string `json:"status"`
	DependsOn string `json:"dependsOn,omitempty"`
}

type WorkshopCollectionDTO struct {
	ID          string               `json:"id"`
	Title       string               `json:"title"`
	Owner       string               `json:"owner"`
	Game        string               `json:"game"`
	UpdatedAt   string               `json:"updatedAt"`
	NumChildren int                  `json:"numChildren"`
	Children    []CollectionChildDTO `json:"children"`
	Status      string               `json:"status"`
}

// ResolveResult is the tagged union actually cached and returned -- one of
// the three response shapes below, selected by Kind.
type ResolveResult struct {
	Kind       string                 `json:"kind"` // "item" | "collection" | "removed" | "private" | "not-found"
	Item       *WorkshopItemDTO       `json:"item,omitempty"`
	Collection *WorkshopCollectionDTO `json:"collection,omitempty"`
	ID         string                 `json:"id,omitempty"`
	Title      string                 `json:"title,omitempty"`
}
