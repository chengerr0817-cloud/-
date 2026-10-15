# 墨迹博客 · 后端 API

基于 Express + TypeScript 的 REST API 服务，数据层使用 Node.js 内置的 **SQLite**（`node:sqlite`），零原生依赖。

## 技术栈

- **运行时**：Node.js 22+（依赖内置 `node:sqlite`）
- **框架**：Express 4 + TypeScript（NodeNext / ESM）
- **数据库**：SQLite（`node:sqlite`，WAL 模式）
- **认证**：JWT（jsonwebtoken）+ bcryptjs
- **文件上传**：multer（本地磁盘）
- **校验**：Zod
- **日志**：Pino

## 目录结构

```
backend/
├── src/
│   ├── modules/               # 业务模块
│   │   ├── blog-repo.ts       # 数据访问层（SQL）
│   │   ├── blog.ts            # 博客路由（读取 + 写作）
│   │   ├── auth.ts            # 注册 / 登录 / 当前用户
│   │   └── upload.ts          # 图片与附件上传
│   ├── middleware/
│   │   └── auth.ts            # JWT 解析与鉴权
│   ├── config/
│   │   ├── database.ts        # SQLite 连接、schema、查询助手
│   │   ├── env.ts             # 环境变量
│   │   └── logger.ts          # Pino 日志
│   ├── scripts/
│   │   ├── seed.ts            # 导入示例文章 + 创建默认账号
│   │   └── seed-posts.json    # 示例文章数据
│   ├── app.ts                 # Express 应用装配
│   └── index.ts               # 服务入口
├── data/blog.db               # SQLite 数据库（运行时生成，已 gitignore）
├── uploads/                   # 上传文件（运行时生成，已 gitignore）
└── Dockerfile
```

## 快速开始

```bash
pnpm install          # 安装依赖
pnpm run seed         # 初始化数据库并导入示例文章
pnpm dev              # 开发模式（tsx watch，端口 3000）
```

默认账号：`admin` / `moji123456`

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `NODE_ENV` | `development` | 生产环境设为 `production` |
| `PORT` | `3000` | 监听端口 |
| `API_PREFIX` | `/api` | API 路由前缀 |
| `CORS_ORIGIN` | `*` | 允许来源，生产环境务必指定域名 |
| `JWT_SECRET` | 内置开发密钥 | **生产必须修改** |
| `DB_PATH` | `data/blog.db` | SQLite 文件路径 |
| `UPLOAD_DIR` | `uploads` | 上传目录 |

## 接口一览

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| `GET` | `/api/health` | — | 健康检查 |
| `GET` | `/api/blog/posts` | 可选 | 文章列表（`page` / `limit`） |
| `GET` | `/api/blog/posts/hot` | — | 热门文章 |
| `GET` | `/api/blog/posts/:slug` | — | 文章详情（含标签、相关文章） |
| `GET` | `/api/blog/tags` | — | 全部标签 |
| `GET` | `/api/blog/stats` | — | 站点统计 |
| `POST` | `/api/blog/views/:slug` | — | 浏览量 +1 |
| `POST` | `/api/auth/register` | — | 注册 |
| `POST` | `/api/auth/login` | — | 登录（返回 JWT） |
| `GET` | `/api/auth/me` | ✅ | 当前用户 |
| `GET` | `/api/auth/status` | — | 是否已有账号 |
| `GET` | `/api/blog/my/posts` | ✅ | 我的文章（含草稿） |
| `GET` | `/api/blog/my/posts/:id/tags` | ✅ | 文章标签名 |
| `POST` | `/api/blog/posts` | ✅ | 新建文章 |
| `PUT` | `/api/blog/posts/:id` | ✅ | 更新文章 |
| `DELETE` | `/api/blog/posts/:id` | ✅ | 删除文章 |
| `POST` | `/api/upload` | ✅ | 上传文件（≤10MB） |

## 数据表

```sql
users     (id, username, password_hash, display_name, created_at)
posts     (id, user_id, title, slug, summary, content, cover_url,
           status, views, read_minutes, author_name,
           created_at, updated_at, published_at)
tags      (id, name, slug, color)
post_tags (post_id, tag_id)
```

## 构建与生产运行

```bash
pnpm build            # 编译到 dist/
NODE_ENV=production JWT_SECRET=xxx node dist/index.js
```

生产模式下，若 `../frontend/dist` 存在，后端会自动托管前端静态资源，
因此单进程即可提供完整服务。
