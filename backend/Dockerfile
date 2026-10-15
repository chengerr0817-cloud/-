# ============================================================
# 墨迹博客 · 后端 API —— 生产镜像
# 多阶段构建：builder 装依赖 + 编译 TS，runner 只带产物与生产依赖
# ============================================================

# ---------- Stage 1: builder ----------
FROM node:22-alpine AS builder

WORKDIR /app

# 启用 pnpm（corepack 已随 node 附带）
RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

# 先复制依赖清单，利用 Docker 层缓存
COPY package.json pnpm-lock.yaml ./

# 安装全部依赖（含 devDependencies，编译 TS 需要 typescript）
#   --config.minimum-release-age=0    关闭新版 pnpm 的发布冷却策略
#   --config.dangerously-allow-all-builds=true  放行 esbuild 等依赖的构建脚本
RUN pnpm install --frozen-lockfile \
      --config.minimum-release-age=0 \
      --config.dangerously-allow-all-builds=true

# 复制源码并编译
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

# 只保留生产依赖，减小最终镜像
RUN pnpm prune --prod

# ---------- Stage 2: runner ----------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# 云托管默认注入 PORT，这里给个兜底默认值
ENV PORT=3000
ENV API_PREFIX=/api

# 非 root 运行，提升安全性
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# 从 builder 拷贝产物与生产依赖
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

USER nodejs

EXPOSE 3000

# 健康检查：命中 /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+(process.env.API_PREFIX||'/api')+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
