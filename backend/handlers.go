package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"time"
)

// resolveTimeout bounds a single request's worst case: comfortably under
// the server's 30s WriteTimeout even for a large collection needing
// several sequential child-detail batches.
const resolveTimeout = 15 * time.Second

// handleResolveItem replaces the former 501 stub with the real resolve
// flow. Input validation happens before any cache lookup or outbound
// call, so a malformed id never costs a Steam request or a cache entry.
func handleResolveItem(rv *resolver) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, ok := parsePublishedFileID(r.PathValue("id"))
		if !ok {
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"error":   "invalid_id",
				"message": "id must be a positive integer",
			})
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), resolveTimeout)
		defer cancel()

		result, err := rv.Resolve(ctx, id)
		if err != nil {
			if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled) {
				writeJSON(w, http.StatusGatewayTimeout, map[string]string{
					"error":   "upstream_timeout",
					"message": "steam did not respond in time",
				})
				return
			}
			log.Printf("resolve %d: %v", id, err)
			writeJSON(w, http.StatusBadGateway, map[string]string{
				"error":   "upstream_error",
				"message": "failed to resolve item from steam",
			})
			return
		}

		writeJSON(w, http.StatusOK, result)
	}
}
