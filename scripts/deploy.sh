#!/usr/bin/env bash
# ============================================================
# 墨迹博客 · 容器化脚本
#
# 用法：
#   ./scripts/deploy.sh --local    本地构建镜像并串联前后端验证
#   ./scripts/deploy.sh --build    仅构建前后端镜像
#   ./scripts/deploy.sh --push     构建并推送镜像到仓库（需设 REGISTRY）
#
# 环境变量（可选）：
#   REGISTRY   镜像仓库前缀，如 registry.example.com/your-ns
#   JWT_SECRET 后端 JWT 签名密钥（强烈建议设置）
# ============================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REGISTRY="${REGISTRY:-}"
JWT_SECRET="${JWT_SECRET:-moji-container-dev-secret-change-me}"

BACKEND_IMAGE="moji-backend:latest"
FRONTEND_IMAGE="moji-frontend:latest"
NETWORK="moji-net"

log()  { printf "\033[1;33m[deploy]\033[0m %s\n" "$*"; }
fail() { printf "\033[1;31m[error]\033[0m %s\n" "$*" >&2; exit 1; }

build_backend() {
  log "构建后端镜像 $BACKEND_IMAGE ..."
  docker build -t "$BACKEND_IMAGE" "$ROOT_DIR/backend"
}

build_frontend() {
  log "构建前端镜像 $FRONTEND_IMAGE ..."
  docker build -t "$FRONTEND_IMAGE" "$ROOT_DIR/frontend"
}

push_images() {
  [ -n "$REGISTRY" ] || fail "--push 需要设置 REGISTRY 环境变量"
  local be="$REGISTRY/moji-backend:latest" fe="$REGISTRY/moji-frontend:latest"
  docker tag "$BACKEND_IMAGE"  "$be"; docker push "$be"
  docker tag "$FRONTEND_IMAGE" "$fe"; docker push "$fe"
  log "已推送：$be / $fe"
}

local_run() {
  build_backend
  build_frontend

  log "启动本地联调环境 ..."
  docker rm -f moji-be moji-fe >/dev/null 2>&1 || true
  docker network create "$NETWORK" >/dev/null 2>&1 || true

  # 数据与上传落在具名卷中，容器重建后不丢数据。
  docker volume create moji-data   >/dev/null
  docker volume create moji-upload >/dev/null

  docker run -d --name moji-be --network "$NETWORK" \
    -v moji-data:/app/data \
    -v moji-upload:/app/uploads \
    -e NODE_ENV=production \
    -e JWT_SECRET="$JWT_SECRET" \
    -e DB_PATH=/app/data/blog.db \
    -e UPLOAD_DIR=/app/uploads \
    "$BACKEND_IMAGE" >/dev/null

  docker run -d --name moji-fe --network "$NETWORK" -p 8080:80 \
    -e BACKEND_UPSTREAM="http://moji-be:3000" \
    "$FRONTEND_IMAGE" >/dev/null

  log "等待服务就绪 ..."
  sleep 6

  log "健康检查："
  curl -s  -o /dev/null -w "  前端首页             -> %{http_code}\n" http://localhost:8080/        || true
  curl -s  -o /dev/null -w "  SPA 回退             -> %{http_code}\n" http://localhost:8080/posts/  || true
  printf "  后端 /api/health     -> "; curl -s http://localhost:8080/api/health || true; echo
  printf "  后端 /api/blog/stats -> "; curl -s http://localhost:8080/api/blog/stats || true; echo

  log "访问 http://localhost:8080 查看效果"
  log "清理：docker rm -f moji-be moji-fe && docker network rm $NETWORK"
}

build_only() { build_backend; build_frontend; log "镜像构建完成"; }

case "${1:-}" in
  --local) local_run ;;
  --build) build_only ;;
  --push)  build_backend; build_frontend; push_images ;;
  *) cat <<EOF
墨迹博客 · 容器化脚本

用法：
  ./scripts/deploy.sh --local    本地构建并串联验证（访问 http://localhost:8080）
  ./scripts/deploy.sh --build    仅构建前后端镜像
  ./scripts/deploy.sh --push     构建并推送镜像（需 REGISTRY）

本地开发请改用：./scripts/start-local.sh
EOF
     ;;
esac
