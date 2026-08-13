package main

import "strconv"

// parsePublishedFileID validates and parses a Steam published file id from
// a URL path value. Stricter than the frontend's unbounded /^\d+$/
// (src/lib/parseWorkshopInput.ts): rejects "0", leading zeros, and anything
// that doesn't fit in a uint64. A digit-count check alone would still let a
// 20+ digit string through that numerically overflows uint64 -- ParseUint
// catches that. Run before any cache lookup or outbound call, so garbage
// input never costs a Steam request or a cache entry.
func parsePublishedFileID(s string) (uint64, bool) {
	if s == "" || len(s) > 20 {
		return 0, false
	}
	if s[0] == '0' {
		return 0, false
	}
	for _, c := range s {
		if c < '0' || c > '9' {
			return 0, false
		}
	}
	id, err := strconv.ParseUint(s, 10, 64)
	if err != nil {
		return 0, false
	}
	return id, true
}
