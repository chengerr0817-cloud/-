# 墨迹博客 · 部署指南（腾讯云开发云托管）

本项目采用 **前后端分离 + 全云端数据层** 架构。数据层（PostgreSQL / 云存储 / Auth）已经在腾讯云开发（TCB）中运行，**无需重复部署**；部署工作是把「前端静态站点」和「后端 API 服务」发布到公网。

---

## 一、架构总览

| 部分 | 技术 | 部署去向 |
|------|------|----------|
| 前端 | React 19 + Vite（构建为静态文件） | Nginx 容器 / TCB 静态托管 |
| 后端 | Express + TypeScript（Node 服务） | 云托管（CloudBase Run）容器 |
| 数据层 | PostgreSQL + 云存储 + Auth | **已在 TCB，无需部署** |

### 已为你准备好的文件

| 文件 | 用途 |
|------|------|
| `backend/Dockerfile` | 后端生产镜像（多阶段、非 root、健康检查） |
| `frontend/Dockerfile` | 前端生产镜像（构建 dist + Nginx 托管） |
| `frontend/nginx.conf.template` | Nginx 站点模板（SPA 回退 + `/api` 反代，支持 envsubst） |
| `cloudbaserc.json` | 云开发 CLI 部署配置 |
| `scripts/deploy.sh` | 一键构建 + 推送镜像脚本 |

---

## 二、部署前必做配置

### 1. 后端环境变量

在云托管控制台为 **后端服务** 注入以下环境变量（值取自本地 `/workspace/.env.tcb`）：

| 变量 | 说明 | 示例 |
|------|------|------|
| `NODE_ENV` | 运行模式 | `production` |
| `PORT` | 监听端口 | `3000` |
| `API_PREFIX` | API 前缀 | `/api` |
| `CLOUDBASE_ENV_ID` | TCB 环境 ID | `gn-261014090703-...` |
| `CLOUDBASE_REGION` | 地域 | `ap-shanghai` |
| `CLOUDBASE_PUBLISH_KEY` | 匿名访问令牌 | `eyJhbGci...` |
| `CORS_ORIGIN` | **允许的前端域名** | `https://your-domain.com` |

> ⚠️ `CORS_ORIGIN` 生产环境**不要**用 `*`，必须填具体前端域名。

### 2. 前端构建参数

前端 TCB 配置在 **构建期** 注入（Vite `define`），通过 Docker build-arg 传入：

```
--build-arg VITE_CLOUDBASE_ENV_ID=gn-...
--build-arg VITE_CLOUDBASE_REGION=ap-shanghai
--build-arg VITE_CLOUDBASE_PUBLISH_KEY=eyJhbGci...
--build-arg VITE_OAUTH_RELAY_URL=https://genie.codebuddy.cn/api/public/oauth
```

### 3. 前端上游地址

前端 Nginx 通过环境变量 `BACKEND_UPSTREAM` 找到后端：

- **TCB 云托管内网**：`http://<后端服务名>:3000`（同环境内网互通）
- **同机 Docker**：`http://moji-be:3000`（容器名）或 `http://127.0.0.1:3000`

### 4. 控制台配置（易漏项，务必检查）

| 项 | 位置 | 说明 |
|----|------|------|
| **OAuth 回调白名单** | TCB 认证控制台 → 登录方式 | 加入生产域名，否则 Google 登录会失败 |
| **安全域名白名单** | TCB 控制台 → 环境 → 安全配置 | 加入生产域名，否则前端 SDK 拒绝调用 |
| **CORS** | 后端环境变量 | 见上表 |
| **保持 RLS 开启** | 数据库 | **切勿关闭**，它是权限的最后防线 |

---

## 三、部署方式 A：云开发 CLI（推荐）

### 安装 CLI

```bash
npm i -g @cloudbase/cli
tcb login          # 扫码登录，选择对应账号
```

### 构建前端产物

```bash
cd frontend
pnpm install
# 从 .env.tcb 读取配置（vite.config.ts 已支持）
pnpm build          # 产物在 frontend/dist
```

### 部署后端容器

```bash
# 在项目根目录执行
tcb run deploy moji-backend \
  --path ./backend \
  --dockerfile ./backend/Dockerfile \
  --port 3000
```

随后在控制台为该服务补上 **环境变量**（见第二节第 1 项）。

### 部署前端静态托管

```bash
tcb hosting deploy ./frontend/dist / -e gn-261014090703-4532-d1ae91379d6
```

> 静态托管需在控制台开启 **SPA 回退**（错误文档指向 `index.html`），否则刷新 `/posts/xxx` 会 404。

---

## 四、部署方式 B：容器镜像（云托管 / 任意容器平台）

### 后端

```bash
cd backend
docker build -t moji-backend:latest .
docker tag moji-backend:latest <你的镜像仓库>/moji-backend:latest
docker push <你的镜像仓库>/moji-backend:latest
```

推送后在云托管创建服务，指定镜像、端口 `3000`、环境变量。

### 前端

```bash
cd frontend
docker build \
  --build-arg VITE_CLOUDBASE_ENV_ID=gn-261014090703-4532-d1ae91379d6 \
  --build-arg VITE_CLOUDBASE_REGION=ap-shanghai \
  --build-arg VITE_CLOUDBASE_PUBLISH_KEY=<publish-key> \
  --build-arg VITE_OAUTH_RELAY_URL=https://genie.codebuddy.cn/api/public/oauth \
  -t moji-frontend:latest .
```

运行时指定后端地址：

```bash
docker run -d -p 80:80 \
  -e BACKEND_UPSTREAM=http://moji-be:3000 \
  moji-frontend:latest
```

### 本地一键联调（含数据库代理）

```bash
./scripts/deploy.sh --local    # 构建并本地串联前后端验证
```

---

## 五、域名与 HTTPS

1. 在 TCB 控制台为「静态托管」或「云托管」绑定自定义域名
2. 开启 HTTPS（TCB 提供免费证书）
3. **前后端建议同域**（前端 `/`、后端 `/api` 由 Nginx 反代），可完全避免跨域问题
4. 绑定后回到第二节第 4 项，把域名补进 OAuth 回调与安全域名白名单

---

## 六、安全清单

- [ ] `.env.tcb` **不要**提交到 Git（已在 `.gitignore` 中）
- [ ] 生产环境 `CORS_ORIGIN` 填具体域名，不写 `*`
- [ ] 数据库 **RLS 保持开启**
- [ ] publish key 是设计给前端用的受限匿名令牌，可出现在前端产物中；**数据库管理密钥等其它凭据绝不能走 `VITE_` 前缀**
- [ ] 容器以非 root 运行（后端 Dockerfile 已处理）
- [ ] 定期轮换 publish key

---

## 七、常见问题

**Q：前端页面能开，但数据不显示？**
检查 TCB 控制台的「安全域名白名单」是否加了生产域名，以及构建时 `VITE_CLOUDBASE_*` 是否注入成功。

**Q：刷新文章详情页 404？**
静态托管未开 SPA 回退。云托管容器方案已在 `nginx.conf.template` 用 `try_files ... /index.html` 处理。

**Q：登录跳转后回调失败？**
OAuth 回调白名单缺生产域名。去 TCB 认证控制台补上。

**Q：后端容器启动后 `/api/blog/*` 报 500？**
后端缺 `CLOUDBASE_ENV_ID` 等环境变量（日志会提示 `CLOUDBASE_ENV_ID not set`）。在云托管控制台补上。

**Q：Nginx 启动报 `host not found in upstream`？**
`BACKEND_UPSTREAM` 未设置或地址不可达。确认后端容器名 / 内网地址正确。
