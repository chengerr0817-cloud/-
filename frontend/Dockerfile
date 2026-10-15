# ============================================================
# 墨迹博客 · 前端 —— 生产镜像
# 多阶段构建：node 构建 dist → nginx 托管静态文件
#
# 构建期需要 TCB 凭据（Vite 在编译时通过 define 注入）。
# 把凭据作为 build-arg 传入：
#   docker build \
#     --build-arg VITE_CLOUDBASE_ENV_ID=xxx \
#     --build-arg VITE_CLOUDBASE_REGION=ap-shanghai \
#     --build-arg VITE_CLOUDBASE_PUBLISH_KEY=xxx \
#     --build-arg VITE_OAUTH_RELAY_URL=https://... \
#     -t moji-frontend .
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

# Build-time env —— 注入到 Vite 的 import.meta.env
ARG VITE_CLOUDBASE_ENV_ID=""
ARG VITE_CLOUDBASE_REGION="ap-shanghai"
ARG VITE_CLOUDBASE_PUBLISH_KEY=""
ARG VITE_OAUTH_RELAY_URL=""
ENV VITE_CLOUDBASE_ENV_ID=$VITE_CLOUDBASE_ENV_ID
ENV VITE_CLOUDBASE_REGION=$VITE_CLOUDBASE_REGION
ENV VITE_CLOUDBASE_PUBLISH_KEY=$VITE_CLOUDBASE_PUBLISH_KEY
ENV VITE_OAUTH_RELAY_URL=$VITE_OAUTH_RELAY_URL

RUN pnpm build

# ---------- Stage 2: nginx ----------
FROM nginx:1.27-alpine AS runner

# 站点模板 —— 官方镜像启动时对 /etc/nginx/templates/*.template 执行 envsubst
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# 构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 后端上游地址：同容器网络下指向后端服务
#   TCB 云托管：填后端服务的内网访问地址，如 http://moji-backend:3000
#   同机 Docker：填 http://host.docker.internal:3000 或后端容器名
ENV BACKEND_UPSTREAM="http://127.0.0.1:3000"

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
