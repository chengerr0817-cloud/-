#!/usr/bin/env bash
# ============================================================
# 墨迹博客 · 部署脚本
#
# 用法：
#   ./scripts/deploy.sh --local     本地构建镜像并串联前后端验证
#   ./scripts/deploy.sh --build     仅构建前后端镜像
#   ./scripts/deploy.sh --push      构建并推送镜像到仓库（需设 REGISTRY）
#   ./scripts/deploy.sh --frontend  仅构建前端并部署到 TCB 静态托管
#
# 环境变量（可选）：
#   REGISTRY   镜像仓库前缀，如 ccr.ccs.tencentyun.com/your-ns
#   ENV_FILE   TCB 凭据文件路径，默认 <项目根>/.env.tcb
# ============================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.tcb}"
REGISTRY="${REGISTRY:-}"

BACKEND_IMAGE="moji-backend:latest"
FRONTEND_IMAGE="moji-frontend:latest"
NETWORK="moji-net"

log()  { printf "\033[1;33m[deploy]\033[0m %s\n" "$*"; }
fail() { printf "\033[1;31m[error]\033[0m %s\n" "$*" >&2; exit 1; }

# ---------- 读取 TCB 凭据 ----------
load_env() {
  [ -f "$ENV_FILE" ] || fail "找不到 TCB 凭据文件：$ENV_FILE"
  # shellcheck disable=SC1090
  set -a; source "$ENV_FILE"; set +a
  : "${CLOUDBASE_ENV_ID:?缺少 CLOUDBASE_ENV_ID}"
  : "${CLOUDBASE_PUBLISH_KEY:?缺少 CLOUDBASE_PUBLISH_KEY}"
  CLOUDBASE_REGION="${CLOUDBASE_REGION:-ap-shanghai}"
  VITE_OAUTH_RELAY_URL="${VITE_OAUTH_RELAY_URL:-}"
  log "TCB 环境：$CLOUDBASE_ENV_ID（$CLOUDBASE_REGION）"
}

build_backend() {
  log "构建后端镜像 $BACKEND_IMAGE ..."
  docker build -t "$BACKEND_IMAGE" "$ROOT_DIR/backend"
}

build_frontend() {
  log "构建前端镜像 $FRONTEND_IMAGE ..."
  docker build \
    --build-arg VITE_CLOUDBASE_ENV_ID="$CLOUDBASE_ENV_ID" \
    --build-arg VITE_CLOUDBASE_REGION="$CLOUDBASE_REGION" \
    --build-arg VITE_CLOUDBASE_PUBLISH_KEY="$CLOUDBASE_PUBLISH_KEY" \
    --build-arg VITE_OAUTH_RELAY_URL="$VITE_OAUTH_RELAY_URL" \
    -t "$FRONTEND_IMAGE" "$ROOT_DIR/frontend"
}

push_images() {
  [ -n "$REGISTRY" ] || fail "--push 需要设置 REGISTRY 环境变量"
  local be="$REGISTRY/moji-backend:latest" fe="$REGISTRY/moji-frontend:latest"
  docker tag "$BACKEND_IMAGE"  "$be"; docker push "$be"
  docker tag "$FRONTEND_IMAGE" "$fe"; docker push "$fe"
  log "已推送：$be / $fe"
}

local_run() {
  load_env
  build_backend
  build_frontend

  log "启动本地联调环境 ..."
  docker rm -f moji-be moji-fe >/dev/null 2>&1 || true
  docker network create "$NETWORK" >/dev/null 2>&1 || true

  docker run -d --name moji-be --network "$NETWORK" \
    -e CLOUDBASE_ENV_ID="$CLOUDBASE_ENV_ID" \
    -e CLOUDBASE_REGION="$CLOUDBASE_REGION" \
    -e CLOUDBASE_PUBLISH_KEY="$CLOUDBASE_PUBLISH_KEY" \
    "$BACKEND_IMAGE" >/dev/null

  docker run -d --name moji-fe --network "$NETWORK" -p 8080:80 \
    -e BACKEND_UPSTREAM="http://moji-be:3000" \
    "$FRONTEND_IMAGE" >/dev/null

  log "等待服务就绪 ..."
  sleep 6

  log "健康检查："
  curl -s  -o /dev/null -w "  前端首页           -> %{http_code}\n" http://localhost:8080/          || true
  curl -s  -o /dev/null -w "  SPA 回退           -> %{http_code}\n" http://localhost:8080/posts/       || true
  printf "  后端 /api/health   -> "; curl -s http://localhost:8080/api/health || true; echo
  printf "  后端 /api/blog/stats -> "; curl -s http://localhost:8080/api/blog/stats || true; echo

  log "访问 http://localhost:8080 查看效果"
  log "清理：docker rm -f moji-be moji-fe && docker network rm $NETWORK"
}

build_only() { load_env; build_backend; build_frontend; log "镜像构建完成"; }

frontend_only() {
  load_env
  log "构建前端产物 ..."
  ( cd "$ROOT_DIR/frontend" && pnpm install && pnpm build )
  command -v tcb >/dev/null 2>&1 || fail "未安装 @cloudbase/cli，请先 npm i -g @cloudbase/cli"
  log "部署到 TCB 静态托管 ..."
  tcb hosting deploy "$ROOT_DIR/frontend/dist" / -e "$CLOUDBASE_ENV_ID"
}

case "${1:-}" in
  --local)    local_run ;;
  --build)    build_only ;;
  --push)     load_env; build_backend; build_frontend; push_images ;;
  --frontend) frontend_only ;;
  *) cat <<EOF
墨迹博客 · 部署脚本

用法：
  ./scripts/deploy.sh --local     本地构建并串联验证（访问 http://localhost:8080）
  ./scripts/deploy.sh --build     仅构建前后端镜像
  ./scripts/deploy.sh --push      构建并推送镜像（需 REGISTRY）
  ./scripts/deploy.sh --frontend  构建前端并部署到 TCB 静态托管

详见 DEPLOY.md
EOF
     ;;
esac
