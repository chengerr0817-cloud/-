#!/bin/bash
# ============================================================
# 墨迹博客 · 桌面控制台一键启动
# 用法：双击运行，或命令行 ./start-desktop.sh
# 功能：自动补装依赖 / 自动构建（仅首次）→ 打开控制台窗口
# ============================================================
set -u
cd "$(dirname "$0")"

# 1) 依赖未装 → 自动安装
if [ ! -d node_modules/electron/dist ]; then
  echo "[首次运行] 正在安装依赖（约 1-2 分钟，仅需一次）…"
  pnpm install || npm install
fi

# 2) 未构建或代码更新过 → 重新构建（增量，很快）
if [ ! -f dist/main/index.js ] || [ -n "$(find src -newer dist/main/index.js -print -quit 2>/dev/null)" ]; then
  echo "[i] 构建中…"
  pnpm build >/dev/null 2>&1 || npm run build
fi

# 3) 启动（已开着会自动聚焦已有窗口，不会重复开）
#    root 环境下 Chromium 要求显式关闭沙箱（仅影响 root，普通用户无需此参数）
if [ "$(id -u)" = "0" ]; then
  exec ./node_modules/electron/dist/electron . --no-sandbox "$@"
else
  exec ./node_modules/electron/dist/electron . "$@"
fi
