package main

import (
	"context"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

const (
	perIPRateLimit    = rate.Limit(1) // sustained requests/sec per client
	perIPBurst        = 5
	ipEntryIdleExpiry = 10 * time.Minute
	ipJanitorInterval = 5 * time.Minute
)

type ipEntry struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

// ipRateLimiter has its own mutex, deliberately separate from store's --
// unrelated subsystems with unrelated contention patterns shouldn't share
// a lock just because both happen to need one.
type ipRateLimiter struct {
	mu      sync.Mutex
	entries map[string]*ipEntry
}

func newIPRateLimiter() *ipRateLimiter {
	return &ipRateLimiter{entries: make(map[string]*ipEntry)}
}

func (l *ipRateLimiter) allow(ip string) bool {
	l.mu.Lock()
	entry, ok := l.entries[ip]
	if !ok {
		entry = &ipEntry{limiter: rate.NewLimiter(perIPRateLimit, perIPBurst)}
		l.entries[ip] = entry
	}
	entry.lastSeen = time.Now()
	l.mu.Unlock()

	return entry.limiter.Allow()
}

// startJanitor evicts entries idle past ipEntryIdleExpiry so the map
// doesn't grow without bound under IP-rotating abuse; runs until ctx is
// cancelled.
func (l *ipRateLimiter) startJanitor(ctx context.Context) {
	go func() {
		ticker := time.NewTicker(ipJanitorInterval)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				cutoff := time.Now().Add(-ipEntryIdleExpiry)
				l.mu.Lock()
				for ip, entry := range l.entries {
					if entry.lastSeen.Before(cutoff) {
						delete(l.entries, ip)
					}
				}
				l.mu.Unlock()
			}
		}
	}()
}

// rateLimitMiddleware applies the per-IP limiter to the wrapped handler
// only -- mount this on /api/v1/items/, not sitewide.
func rateLimitMiddleware(limiter *ipRateLimiter, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := clientIP(r)
		if !limiter.allow(ip) {
			w.Header().Set("Retry-After", "1")
			writeJSON(w, http.StatusTooManyRequests, map[string]string{
				"error":   "rate_limited",
				"message": "too many requests, slow down",
			})
			return
		}
		next.ServeHTTP(w, r)
	})
}

// clientIP trusts X-Real-IP only, never X-Forwarded-For: nginx *replaces*
// the former on every hop but only *appends to* the latter, so XFF is
// spoofable by a client prepending its own entry. In production, nginx
// sets X-Real-IP from Cloudflare's CF-Connecting-IP header (the real
// client, since cloudflared is the sole ingress and there's no path to
// nginx that bypasses it -- see nginx.conf). Falls back to RemoteAddr for
// local dev without nginx in front.
func clientIP(r *http.Request) string {
	ip := strings.TrimSpace(r.Header.Get("X-Real-IP"))
	if ip == "" {
		host, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil {
			ip = r.RemoteAddr
		} else {
			ip = host
		}
	}
	return normalizeIP(ip)
}

// normalizeIP masks IPv6 addresses to their /64 -- the smallest block an
// ISP typically delegates to a single customer -- so a client cycling
// through a privacy-extension address within their own /64 can't trivially
// evade the per-IP limit. IPv4 addresses pass through unchanged.
func normalizeIP(ip string) string {
	parsed := net.ParseIP(ip)
	if parsed == nil {
		return ip
	}
	if v4 := parsed.To4(); v4 != nil {
		return v4.String()
	}
	mask := net.CIDRMask(64, 128)
	return parsed.Mask(mask).String()
}
