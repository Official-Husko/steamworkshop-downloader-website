// Command server is the API backend for the Steam Workshop downloader.
//
// Health checking and a Redis-backed counter prove the container/Redis
// wiring end to end. Workshop metadata resolution (steamapi.go,
// resolve.go, cache.go) talks to Steam's public Web API directly; real
// file downloads via go-steamcmd (github.com/frantjc/go-steamcmd) are a
// later phase and not implemented yet.
//
// A second, admin-only HTTP server listens on ADMIN_PORT alongside the
// public one, sharing this process and Redis client. It carries no auth
// of any kind yet — it is a scaffold, kept safe only by never being
// published outside the docker-compose network. Do not add real admin
// functionality or handle sensitive data on it until that's addressed.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/redis/go-redis/v9"
)

// version is set at build time via -ldflags "-X main.version=<short-sha>".
var version = "dev"

func main() {
	port := getenv("PORT", "8080")
	adminPort := getenv("ADMIN_PORT", "8090")
	redisAddr := getenv("REDIS_ADDR", "localhost:6379")
	cacheDir := getenv("CACHE_DIR", "./data")
	steamAPIKey := os.Getenv("STEAM_API_KEY") // no fallback -- catalog refresh just logs and stays empty without it

	rdb := redis.NewClient(&redis.Options{
		Addr:        redisAddr,
		DialTimeout: 2 * time.Second,
		MaxRetries:  1,
	})
	defer rdb.Close()

	cacheStore, err := newStore(cacheDir)
	if err != nil {
		log.Fatalf("cache store init failed: %v", err)
	}
	steamClient := NewSteamClient(steamAPIKey)
	itemResolver := newResolver(steamClient, cacheStore)
	ipLimiter := newIPRateLimiter()

	backgroundCtx, cancelBackground := context.WithCancel(context.Background())
	defer cancelBackground()
	startCacheTickers(backgroundCtx, cacheStore, steamClient)
	ipLimiter.startJanitor(backgroundCtx)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", handleHealthz(rdb))
	mux.HandleFunc("GET /api/v1/stats", handleStats(rdb))
	mux.Handle("GET /api/v1/items/{id}", rateLimitMiddleware(ipLimiter, handleResolveItem(itemResolver)))
	srv := newServer(":"+port, logRequests(mux))

	adminMux := http.NewServeMux()
	adminMux.HandleFunc("GET /admin/healthz", handleHealthz(rdb))
	adminSrv := newServer(":"+adminPort, logRequests(adminMux))

	go func() {
		log.Printf("listening on :%s (redis at %s)", port, redisAddr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server error: %v", err)
		}
	}()

	go func() {
		log.Printf("admin listening on :%s (internal only, no auth)", adminPort)
		if err := adminSrv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("admin server error: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	log.Print("shutting down")
	cancelBackground()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	errPublic := srv.Shutdown(ctx)
	errAdmin := adminSrv.Shutdown(ctx)
	if errPublic != nil || errAdmin != nil {
		log.Fatalf("graceful shutdown failed: public=%v admin=%v", errPublic, errAdmin)
	}

	// Best-effort: a lost cache write only costs extra Steam calls after
	// restart, never real data loss, so this logs rather than treats
	// failure as fatal (unlike the HTTP shutdown errors above).
	if err := cacheStore.flush(); err != nil {
		log.Printf("cache flush on shutdown failed: %v", err)
	}
}

func newServer(addr string, handler http.Handler) *http.Server {
	return &http.Server{
		Addr:         addr,
		Handler:      handler,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
}

func handleHealthz(rdb *redis.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()

		status := "ok"
		redisStatus := "ok"
		code := http.StatusOK
		if err := rdb.Ping(ctx).Err(); err != nil {
			status = "degraded"
			redisStatus = "unreachable"
			code = http.StatusServiceUnavailable
		}

		writeJSON(w, code, map[string]string{
			"status":  status,
			"redis":   redisStatus,
			"version": version,
		})
	}
}

// handleStats increments a Redis-backed counter on every call, proving
// the API <-> Redis path works beyond a simple ping.
func handleStats(rdb *redis.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()

		count, err := rdb.Incr(ctx, "stats:requests_total").Result()
		if err != nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{
				"error": "redis unavailable",
			})
			return
		}

		writeJSON(w, http.StatusOK, map[string]int64{
			"requests_total": count,
		})
	}
}

func writeJSON(w http.ResponseWriter, code int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(body)
}

func logRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start))
	})
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
