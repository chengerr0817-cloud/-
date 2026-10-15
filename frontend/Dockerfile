# ============================================================
# 墨迹博客 · 前端 —— 生产镜像
# 多阶段构建：node 构建 dist → nginx 托管静态文件
#
# 本地化架构下前端无需构建期密钥，直接 docker build 即可：
#   docker build -t moji-frontend .
# ============================================================

# ---------- Stage 1: builder ----------
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile \
      --config.minimum-release-age=0 \
      --config.dangerously-allow-all-builds=true

COPY . .

RUN pnpm build

# ---------- Stage 2: nginx ----------
FROM nginx:1.27-alpine AS runner

# 站点模板 —— 官方镜像启动时对 /etc/nginx/templates/*.template 执行 envsubst
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# 构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 后端上游地址：同容器网络下指向后端服务
#   同机 Docker Compose / 自定义网络：填后端容器名，如 http://moji-be:3000
ENV BACKEND_UPSTREAM="http://127.0.0.1:3000"

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
