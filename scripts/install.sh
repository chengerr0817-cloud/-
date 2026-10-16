#!/bin/bash
# ============================================================
# 墨迹博客 · 一键安装
#
# 在你自己电脑上执行一次，自动完成：
#   1. 检查 Node.js / pnpm 环境
#   2. 安装前后端依赖
#   3. 初始化 SQLite 数据库（含管理员账号与示例数据）
#   4. 构建前端静态资源
#   5. 启动服务并打开浏览器
#
# 用法：
#   ./scripts/install.sh              完整安装并启动
#   ./scripts/install.sh --no-start   只安装，不启动
# ============================================================

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

START=true
[ "${1:-}" = "--no-start" ] && START=false

# ---------- 输出辅助 ----------
BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
step() { printf "${BLUE}[%s/5]${NC} %s\n" "$1" "$2"; }
ok()   { printf "      ${GREEN}✓${NC} %s\n" "$1"; }
warn() { printf "      ${YELLOW}!${NC} %s\n" "$1"; }
die()  { printf "${RED}✗ %s${NC}\n" "$1"; exit 1; }

echo
echo "  墨迹博客 · 一键安装"
echo "  ────────────────────────────────"
echo

# ---------- 1. 环境检查 ----------
step 1 "检查运行环境"

command -v node >/dev/null 2>&1 || die "未找到 Node.js。请先安装 Node.js 22 或更高版本：https://nodejs.org"

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 22 ]; then
  die "Node.js 版本过低（当前 $(node -v)）。本项目使用 Node 内置 SQLite，需要 22 或更高版本。"
fi
ok "Node.js $(node -v)"

# 优先 pnpm，回退 npm
if command -v pnpm >/dev/null 2>&1; then
  PM=pnpm
  ok "pnpm $(pnpm -v)"
else
  PM=npm
  warn "未找到 pnpm，将使用 npm（功能一致，仅速度稍慢）"
  warn "想装 pnpm：npm install -g pnpm"
fi

[ -d "$ROOT/backend" ]  || die "找不到 backend 目录，请在项目根目录运行本脚本"
[ -d "$ROOT/frontend" ] || die "找不到 frontend 目录"

# ---------- 2. 安装依赖 ----------
step 2 "安装依赖（首次约 2-4 分钟）"

install_deps() {
  local dir="$1" label="$2"
  if [ -d "$dir/node_modules" ]; then
    ok "$label 依赖已存在，跳过"
    return
  fi
  printf "      安装 %s 依赖…\n" "$label"
  (cd "$dir" && $PM install >/dev/null 2>&1) || die "$label 依赖安装失败，请手动执行：cd $dir && $PM install"
  ok "$label 依赖就绪"
}

install_deps "$ROOT/backend" "后端"
install_deps "$ROOT/frontend" "前端"

# ---------- 3. 初始化数据库 ----------
step 3 "初始化数据库"

DB_FILE="$ROOT/backend/data/blog.db"

if [ -f "$DB_FILE" ]; then
  COUNT=$(node -e "
    const {DatabaseSync}=require('node:sqlite');
    try{
      const d=new DatabaseSync('$DB_FILE');
      console.log(d.prepare('SELECT COUNT(*) c FROM posts').get().c);
    }catch(e){console.log(0)}
  " 2>/dev/null || echo 0)
  ok "数据库已存在（$COUNT 篇文章），保留现有数据"
else
  mkdir -p "$ROOT/backend/data"
  printf "      创建数据库并写入初始数据…\n"
  (cd "$ROOT/backend" && $PM run seed >/dev/null 2>&1) \
    || warn "自动初始化未成功，后端首次启动时会自行建表"
  [ -f "$DB_FILE" ] && ok "数据库已创建" || warn "数据库将在后端启动时自动创建"
fi

# ---------- 4. 构建前端 ----------
step 4 "构建前端静态资源"

if [ -d "$ROOT/frontend/dist" ]; then
  ok "前端已构建，跳过（如需重建：cd frontend && $PM run build）"
else
  printf "      构建中…\n"
  (cd "$ROOT/frontend" && $PM run build >/dev/null 2>&1) || die "前端构建失败"
  ok "前端构建完成"
fi

# ---------- 5. 启动 ----------
step 5 "启动服务"

if [ "$START" = false ]; then
  warn "已跳过启动（--no-start）"
else
  bash "$ROOT/scripts/start-local.sh" start all
fi

echo
echo "  ────────────────────────────────"
echo "  安装完成"
echo
echo "  博客地址：http://localhost:5173"
echo "  管理账号：admin"
echo "  默认密码：moji123456"
echo
echo "  常用命令（在项目根目录执行）："
echo "    ./scripts/start-local.sh start   # 启动"
echo "    ./scripts/start-local.sh stop    # 停止"
echo "    ./scripts/start-local.sh status  # 查看状态"
echo "    ./scripts/start-local.sh logs    # 看日志"
echo
