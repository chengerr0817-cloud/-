#!/usr/bin/env bash
# ============================================================
# 墨迹博客 · 本地服务管理脚本
#
# 用法：
#   ./scripts/start-local.sh start   [backend|frontend|all]  启动（默认 all）
#   ./scripts/start-local.sh stop    [backend|frontend|all]  停止（默认 all）
#   ./scripts/start-local.sh restart [backend|frontend|all]  重启（默认 all）
#   ./scripts/start-local.sh status                          查看运行状态
#   ./scripts/start-local.sh logs    [backend|frontend]      追踪日志（Ctrl-C 退出）
#
# 特性：
#   - 两个服务真正后台化（setsid 脱离终端，关掉 shell 也不会被带走）
#   - PID 文件记录进程，重复启动安全（已在运行则跳过）
#   - 日志分别写入 logs/backend.log 与 logs/frontend.log
#   - 支持优雅停止（先 TERM 后 KILL），并顺带清理残留子进程
#
# 首次运行会自动安装依赖并初始化数据库（含示例文章）。
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PORT="${BACKEND_PORT:-3000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
JWT_SECRET="${JWT_SECRET:-moji-local-dev-secret-change-me}"

PID_DIR="$ROOT/.run"
LOG_DIR="$ROOT/logs"
BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

mkdir -p "$PID_DIR" "$LOG_DIR"

# ---------- 颜色与日志 ----------
if [ -t 1 ]; then
  C_RESET=$'\033[0m'; C_AMBER=$'\033[38;5;214m'
  C_GREEN=$'\033[32m'; C_RED=$'\033[31m'; C_DIM=$'\033[2m'
else
  C_RESET=""; C_AMBER=""; C_GREEN=""; C_RED=""; C_DIM=""
fi

log()  { printf '%s[墨迹]%s %s\n' "$C_AMBER" "$C_RESET" "$*"; }
ok()   { printf '%s[墨迹]%s %s\n' "$C_GREEN" "$C_RESET" "$*"; }
warn() { printf '%s[墨迹]%s %s\n' "$C_RED"   "$C_RESET" "$*" >&2; }
dim()  { printf '%s%s%s\n' "$C_DIM" "$*" "$C_RESET"; }

# ---------- PID 工具 ----------

# 读取 PID 文件并确认进程真的活着（避免 PID 被复用误判）
read_pid() {
  local file="$1"
  [ -f "$file" ] || return 1
  local pid
  pid="$(cat "$file" 2>/dev/null || true)"
  [ -n "$pid" ] || return 1
  kill -0 "$pid" 2>/dev/null || return 1
  printf '%s' "$pid"
}

# 判断某端口是否已被监听
port_busy() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -i:"$port" >/dev/null 2>&1
  elif command -v ss >/dev/null 2>&1; then
    ss -ltn "sport = :$port" 2>/dev/null | grep -q LISTEN
  else
    return 1
  fi
}

# 等端口就绪，最多等 N * 0.5 秒
wait_port() {
  local port="$1" label="$2" tries="${3:-30}"
  local i=0
  while [ "$i" -lt "$tries" ]; do
    if port_busy "$port"; then return 0; fi
    sleep 0.5
    i=$((i + 1))
  done
  return 1
}

# ---------- 依赖与数据库 ----------

ensure_deps() {
  local dir="$1" label="$2"
  if [ ! -d "$ROOT/$dir/node_modules" ]; then
    log "安装${label}依赖…（首次较慢，请稍候）"
    (cd "$ROOT/$dir" && pnpm install \
      --config.minimum-release-age=0 \
      --config.dangerously-allow-all-builds=true)
  fi
}

ensure_db() {
  local db="$ROOT/backend/data/blog.db"
  if [ ! -f "$db" ]; then
    log "未检测到数据库，正在导入示例文章…"
    (cd "$ROOT/backend" && pnpm run seed)
  fi
}

# ---------- 启动 / 停止 ----------

start_backend() {
  if pid="$(read_pid "$BACKEND_PID_FILE")"; then
    ok "后端已在运行（PID $pid，:${BACKEND_PORT}），跳过启动"
    return 0
  fi
  if port_busy "$BACKEND_PORT"; then
    warn "端口 ${BACKEND_PORT} 已被其他进程占用，请先释放或改用 BACKEND_PORT=xxxx 启动"
    return 1
  fi

  ensure_deps backend "后端"
  ensure_db

  log "启动后端 http://localhost:${BACKEND_PORT}"
  (
    cd "$ROOT/backend"
    # setsid 让进程脱离当前终端会话；即便启动它的 shell 退出也不会被带走
    setsid env \
      PORT="$BACKEND_PORT" \
      JWT_SECRET="$JWT_SECRET" \
      NODE_ENV="${NODE_ENV:-development}" \
      npx tsx src/index.ts \
      >>"$BACKEND_LOG" 2>&1 &
    echo $! >"$BACKEND_PID_FILE"
  )

  if wait_port "$BACKEND_PORT" "后端" 40; then
    ok "后端就绪（PID $(cat "$BACKEND_PID_FILE")，日志 $BACKEND_LOG）"
  else
    warn "后端启动失败，最后 20 行日志："
    tail -n 20 "$BACKEND_LOG" >&2 || true
    stop_one backend quiet
    return 1
  fi
}

start_frontend() {
  if pid="$(read_pid "$FRONTEND_PID_FILE")"; then
    ok "前端已在运行（PID $pid，:${FRONTEND_PORT}），跳过启动"
    return 0
  fi
  if port_busy "$FRONTEND_PORT"; then
    warn "端口 ${FRONTEND_PORT} 已被其他进程占用，请先释放或改用 FRONTEND_PORT=xxxx 启动"
    return 1
  fi

  ensure_deps frontend "前端"

  log "启动前端 http://localhost:${FRONTEND_PORT}"
  (
    cd "$ROOT/frontend"
    setsid env \
      BACKEND_PORT="$BACKEND_PORT" \
      npx vite --host :: --port "$FRONTEND_PORT" --strictPort \
      >>"$FRONTEND_LOG" 2>&1 &
    echo $! >"$FRONTEND_PID_FILE"
  )

  if wait_port "$FRONTEND_PORT" "前端" 40; then
    ok "前端就绪（PID $(cat "$FRONTEND_PID_FILE")，日志 $FRONTEND_LOG）"
  else
    warn "前端启动失败，最后 20 行日志："
    tail -n 20 "$FRONTEND_LOG" >&2 || true
    stop_one frontend quiet
    return 1
  fi
}

# 停止单个服务。$2=quiet 时不输出未运行提示。
stop_one() {
  local name="$1" mode="${2:-loud}"
  local pidfile port label
  case "$name" in
    backend)  pidfile="$BACKEND_PID_FILE";  port="$BACKEND_PORT";  label="后端" ;;
    frontend) pidfile="$FRONTEND_PID_FILE"; port="$FRONTEND_PORT"; label="前端" ;;
    *) return 1 ;;
  esac

  local pid=""
  pid="$(read_pid "$pidfile")" || true

  if [ -z "$pid" ]; then
    rm -f "$pidfile"
    [ "$mode" = "loud" ] && dim "  ${label}未在运行"
    return 0
  fi

  log "停止${label}（PID $pid）…"
  # 先礼后兵：TERM 给进程机会清理，2 秒后仍不死再 KILL
  kill -TERM "$pid" 2>/dev/null || true
  local i=0
  while [ "$i" -lt 20 ] && kill -0 "$pid" 2>/dev/null; do
    sleep 0.1; i=$((i + 1))
  done
  if kill -0 "$pid" 2>/dev/null; then
    kill -KILL "$pid" 2>/dev/null || true
  fi

  # tsx / vite 会派生孙进程，按端口兜底清理残留监听者
  if port_busy "$port" && command -v lsof >/dev/null 2>&1; then
    lsof -ti:"$port" 2>/dev/null | while read -r p; do kill -KILL "$p" 2>/dev/null || true; done
  fi

  rm -f "$pidfile"
  ok "${label}已停止"
}

stop_all() {
  # 先停前端再停后端，避免前端代理报错刷屏
  stop_one frontend "${1:-loud}"
  stop_one backend  "${1:-loud}"
}

# ---------- 状态 ----------

status_one() {
  local name="$1" pidfile port label
  case "$name" in
    backend)  pidfile="$BACKEND_PID_FILE";  port="$BACKEND_PORT";  label="后端" ;;
    frontend) pidfile="$FRONTEND_PID_FILE"; port="$FRONTEND_PORT"; label="前端" ;;
  esac

  local pid=""
  pid="$(read_pid "$pidfile")" || true

  if [ -n "$pid" ]; then
    printf '  %s✅ %-4s 运行中%s  PID %-7s 端口 %-5s %s\n' \
      "$C_GREEN" "$label" "$C_RESET" "$pid" "$port" "$(probe_http "$name")"
  elif port_busy "$port"; then
    printf '  %s⚠  %-4s 端口被占用%s（非本脚本管理）端口 %s\n' "$C_AMBER" "$label" "$C_RESET" "$port"
  else
    printf '  %s⏹  %-4s 未运行%s\n' "$C_DIM" "$label" "$C_RESET"
  fi
}

# 顺便探活一下 HTTP，让状态更可信
probe_http() {
  local name="$1" url code
  case "$name" in
    backend)  url="http://localhost:${BACKEND_PORT}/api/health" ;;
    frontend) url="http://localhost:${FRONTEND_PORT}/" ;;
  esac
  if command -v curl >/dev/null 2>&1; then
    code="$(curl -s -m 3 -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || echo 000)"
    [ "$code" = "200" ] && printf 'HTTP %s' "$code" || printf 'HTTP %s' "$code"
  fi
}

show_status() {
  log "服务状态"
  status_one backend
  status_one frontend
  echo
  dim "  日志目录：$LOG_DIR"
  dim "  站点地址：http://localhost:${FRONTEND_PORT}"
}

# ---------- 日志 ----------

show_logs() {
  local name="${1:-backend}"
  case "$name" in
    backend)  log "追踪后端日志（Ctrl-C 退出）：$BACKEND_LOG";  tail -f "$BACKEND_LOG" ;;
    frontend) log "追踪前端日志（Ctrl-C 退出）：$FRONTEND_LOG"; tail -f "$FRONTEND_LOG" ;;
    *) warn "未知服务：$name（可选 backend / frontend）"; exit 1 ;;
  esac
}

# ---------- 主流程 ----------

usage() {
  cat <<EOF
墨迹博客 · 本地服务管理

用法：
  $0 start   [backend|frontend|all]   启动（默认 all）
  $0 stop    [backend|frontend|all]   停止（默认 all）
  $0 restart [backend|frontend|all]   重启（默认 all）
  $0 status                           查看运行状态
  $0 logs    [backend|frontend]       追踪日志（默认 backend）

环境变量（可选）：
  BACKEND_PORT    后端端口，默认 3000
  FRONTEND_PORT   前端端口，默认 5173
  JWT_SECRET      后端签名密钥，生产务必修改

启动后访问 http://localhost:${FRONTEND_PORT}
EOF
}

ACTION="${1:-start}"
TARGET="${2:-all}"

case "$ACTION" in
  start)
    case "$TARGET" in
      backend)  start_backend ;;
      frontend) start_frontend ;;
      all)
        start_backend
        start_frontend
        echo
        show_status
        ;;
      *) usage; exit 1 ;;
    esac
    ;;
  stop)
    case "$TARGET" in
      backend)  stop_one backend ;;
      frontend) stop_one frontend ;;
      all)      stop_all ;;
      *) usage; exit 1 ;;
    esac
    ;;
  restart)
    case "$TARGET" in
      backend)  stop_one backend;  start_backend ;;
      frontend) stop_one frontend; start_frontend ;;
      all)
        stop_all
        start_backend
        start_frontend
        echo
        show_status
        ;;
      *) usage; exit 1 ;;
    esac
    ;;
  status)  show_status ;;
  logs)    show_logs "${2:-backend}" ;;
  -h|--help|help) usage ;;
  # 兼容老用法：直接 ./start-local.sh / ./start-local.sh backend
  backend|frontend|all)
    warn "已改用子命令形式，例如：$0 start $ACTION"
    case "$ACTION" in
      backend)  start_backend ;;
      frontend) start_frontend ;;
      all)      start_backend; start_frontend; echo; show_status ;;
    esac
    ;;
  *) usage; exit 1 ;;
esac
