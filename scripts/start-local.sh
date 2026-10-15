#!/usr/bin/env bash
# ============================================================
# 墨迹博客 · 本地一键启动脚本
#
# 用法：
#   ./scripts/start-local.sh          # 同时启动后端(3000)与前端(5173)
#   ./scripts/start-local.sh backend  # 只启动后端
#   ./scripts/start-local.sh frontend # 只启动前端
#
# 首次运行会自动安装依赖并初始化数据库（含示例文章）。
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PORT="${BACKEND_PORT:-3000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
TARGET="${1:-all}"

log() { printf '\033[38;5;214m[墨迹]\033[0m %s\n' "$*"; }

ensure_backend_deps() {
  if [ ! -d "$ROOT/backend/node_modules" ]; then
    log "安装后端依赖…"
    (cd "$ROOT/backend" && pnpm install --config.minimum-release-age=0 --config.dangerously-allow-all-builds=true)
  fi
}

ensure_frontend_deps() {
  if [ ! -d "$ROOT/frontend/node_modules" ]; then
    log "安装前端依赖…"
    (cd "$ROOT/frontend" && pnpm install --config.minimum-release-age=0 --config.dangerously-allow-all-builds=true)
  fi
}

ensure_db() {
  local db="$ROOT/backend/data/blog.db"
  if [ ! -f "$db" ]; then
    log "未检测到数据库，正在导入示例文章…"
    (cd "$ROOT/backend" && pnpm run seed)
  else
    log "数据库已存在：$db"
  fi
}

start_backend() {
  ensure_backend_deps
  ensure_db
  log "启动后端 http://localhost:${BACKEND_PORT}"
  cd "$ROOT/backend"
  PORT="$BACKEND_PORT" \
  JWT_SECRET="${JWT_SECRET:-moji-local-dev-secret-change-me}" \
  exec npx tsx src/index.ts
}

start_frontend() {
  ensure_frontend_deps
  log "启动前端 http://localhost:${FRONTEND_PORT}"
  cd "$ROOT/frontend"
  BACKEND_PORT="$BACKEND_PORT" exec npx vite --host :: --port "$FRONTEND_PORT"
}

case "$TARGET" in
  backend)  start_backend ;;
  frontend) start_frontend ;;
  all)
    ensure_backend_deps
    ensure_db
    log "启动后端 :${BACKEND_PORT} 与前端 :${FRONTEND_PORT}"
    (cd "$ROOT/backend" && PORT="$BACKEND_PORT" JWT_SECRET="${JWT_SECRET:-moji-local-dev-secret-change-me}" npx tsx src/index.ts) &
    BACKEND_PID=$!
    trap 'kill $BACKEND_PID 2>/dev/null || true' EXIT INT TERM
    sleep 2
    start_frontend
    ;;
  *)
    echo "用法: $0 [all|backend|frontend]" >&2
    exit 1
    ;;
esac
