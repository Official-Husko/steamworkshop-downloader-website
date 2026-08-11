// Command server is the API backend for the Steam Workshop downloader.
//
// This is a minimal scaffold: health checking and a Redis-backed counter
// prove the container/Redis wiring end to end. Workshop resolution and
// download proxying will be implemented on top of go-steamcmd
// (github.com/frantjc/go-steamcmd).
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
	redisAddr := getenv("REDIS_ADDR", "localhost:6379")

	rdb := redis.NewClient(&redis.Options{
		Addr:        redisAddr,
		DialTimeout: 2 * time.Second,
		MaxRetries:  1,
	})
	defer rdb.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", handleHealthz(rdb))
	mux.HandleFunc("GET /api/v1/stats", handleStats(rdb))
	mux.HandleFunc("GET /api/v1/items/{id}", handleResolveItem)

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      logRequests(mux),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("listening on :%s (redis at %s)", port, redisAddr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server error: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	log.Print("shutting down")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("graceful shutdown failed: %v", err)
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

// handleResolveItem is a placeholder for Workshop item resolution via
// go-steamcmd. Not implemented yet.
func handleResolveItem(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusNotImplemented, map[string]string{
		"error":   "not_implemented",
		"message": "workshop resolution is not wired up yet",
		"id":      r.PathValue("id"),
	})
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
