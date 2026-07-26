#!/usr/bin/env bash
# Init (or reuse) the memory DB, create the read/write memory user, serve.
set -euo pipefail
DATA_DIR="${DATA_DIR:-/var/lib/dolt}"; cd "$DATA_DIR"
if [ ! -d "$DB/.dolt" ]; then
  mkdir -p "$DB"; ( cd "$DB" && dolt init --name agent-memory --email memoryd@bounded.systems
    dolt sql -q "CREATE TABLE memories (agent VARCHAR(128) NOT NULL, mkey VARCHAR(255) NOT NULL, value LONGTEXT NOT NULL, tags VARCHAR(512) NOT NULL DEFAULT '', created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, PRIMARY KEY (agent, mkey));"
    dolt add -A && dolt commit -m "init: agent-memory store" )
fi
: "${MEM_PASSWORD:?set MEM_PASSWORD (injected by the memory door)}"
cd "$DB"
dolt sql -q "CREATE USER IF NOT EXISTS '${MEM_USER}'@'%' IDENTIFIED BY '${MEM_PASSWORD}'; GRANT ALL ON \`${DB}\`.* TO '${MEM_USER}'@'%';"
echo "serving $DB on :3306 (memory user ${MEM_USER})"
exec dolt sql-server --host 0.0.0.0 --port 3306
