#!/usr/bin/env bash
# Frees the ports this project's dev servers bind to. Exists because a
# previous `npm run dev:all` that didn't shut down cleanly (crashed
# terminal, killed the wrong pid, etc.) can leave one of them locked --
# most commonly `go run .`'s compiled child outliving the `go run` wrapper
# itself, since killing the wrapper alone doesn't kill what it exec'd.
# Runs automatically before dev:all (see package.json's predev:all) and can
# also be run standalone via `npm run dev:clean`.
set -u

PORTS=(5173 5174 8080 8090)

kill_port() {
  local port="$1" signal="$2"
  local pids
  pids=$(lsof -ti tcp:"$port" -sTCP:LISTEN 2>/dev/null)
  [ -z "$pids" ] && return
  echo "freeing port $port (pid(s): $pids)"
  # shellcheck disable=SC2086
  kill "$signal" $pids 2>/dev/null
}

for port in "${PORTS[@]}"; do
  kill_port "$port" -TERM
done

sleep 1

for port in "${PORTS[@]}"; do
  kill_port "$port" -KILL
done

exit 0
