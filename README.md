<div align="center">

# 墨迹 · MoJi

**在代码与思考之间，留下成长的墨迹。**

一个全栈个人技术博客 —— 记录技术学习与个人成长的思考笔记。

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-node%3Asqlite-003B57?logo=sqlite&logoColor=white)](https://nodejs.org/api/sqlite.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

</div>

---

## 📖 项目简介

**墨迹** 是一个面向开发者与写作者的个人博客系统。它以「技术成长」为主题，采用暖琥珀色的编辑风格设计，兼顾阅读体验与写作效率。

项目采用**前后端分离 + 本地自足数据层**架构，开箱即用，无需任何云账号：

- **前端**：React 19 单页应用，负责界面渲染、Markdown 展示与交互
- **后端**：Express API 服务，提供 REST 接口与 JWT 鉴权
- **数据层**：**本地 SQLite**（Node.js 内置 `node:sqlite`，零原生依赖）+ 本地文件上传目录 —— 数据完全保存在你自己的机器上

---

## ✨ 功能特性

### 内容展示

- 📝 **文章列表** — 卡片流布局，含封面、摘要、标签、阅读时长、浏览量，支持分页
- 📄 **文章详情** — 完整 Markdown 渲染（标题 / 列表 / 表格 / 引用 / 代码高亮），
  配阅读进度条、返回顶部、相关文章推荐
- 🏷️ **标签分类** — 标签总览 + 标签详情页，按标签筛选文章
- 🔍 **全文搜索** — 按标题与正文关键词检索文章
- ℹ️ **关于页面** — 站点与作者介绍
- 📊 **站点统计** — 文章数、标签数、总浏览量、总字数

### 写作与管理

- ✍️ **写文章** — Markdown 编辑器，支持标签选择、封面图上传、草稿/发布
- 🗂️ **我的文章** — 管理已发布文章与草稿，支持编辑与删除
- 🖼️ **图片/附件上传** — 上传至本地 `backend/uploads/`，通过 `/uploads/*` 访问
- 🎨 **编辑器预处理** — 自动生成 slug、估算阅读时长

### 认证与安全

- 🔐 **本地账号密码登录** — 用户名 + 密码，bcrypt 加盐哈希存储
- 🎟️ **JWT 令牌** — 30 天有效期，前端存于 `localStorage`
- 🛡️ **路由守卫** — 写文章 / 我的文章等页面需登录访问
- 🔒 **作者隔离** — 写入与修改操作在数据层校验归属：只有作者本人能改删自己的文章

### 体验细节

- 🌗 **暖琥珀主题** — oklch 色彩系统，衬线标题（Playfair Display）+ 无衬线正文（Inter）
- 📱 **响应式布局** — 移动端与桌面端自适应
- ✨ **动效过渡** — 页面切换、卡片悬浮、列表渐入动画
- ⚡ **数据缓存** — TanStack Query 管理服务端状态与缓存

---

## 🖼️ 界面预览

> 截图存放于 `docs/screenshots/`，可自行补充。

| 页面 | 说明 |
|------|------|
| 首页 | 文章卡片流 + 热门标签侧栏 + 站点统计 |
| 文章详情 | Markdown 正文 + 阅读进度 + 相关文章 |
| 标签分类 | 标签总览与按标签筛选 |
| 写文章 | Markdown 编辑器 + 封面上传 |

---

## 🛠️ 技术栈

### 前端

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 7 |
| 样式 | Tailwind CSS v4 + shadcn/ui（Radix UI） |
| 路由 | React Router v7 |
| 数据 | TanStack Query + Axios |
| Markdown | react-markdown + remark-gfm + rehype-highlight + rehype-raw |
| 动画 | Framer Motion |
| 图标 | Lucide React |

### 后端

| 类别 | 技术 |
|------|------|
| 运行时 | Node.js 22 |
| 框架 | Express 4 + TypeScript |
| 数据库 | **SQLite**（Node.js 内置 `node:sqlite`，无需编译原生模块） |
| 认证 | JWT（jsonwebtoken）+ bcryptjs |
| 文件上传 | multer（本地磁盘存储） |
| 校验 | Zod |
| 日志 | Pino |
| 构建 | tsc（NodeNext / ESM） |

### 数据与存储

| 能力 | 实现 |
|------|------|
| 文章 / 标签数据 | `backend/data/blog.db`（SQLite，WAL 模式） |
| 图片与附件 | `backend/uploads/`，经 `/uploads/*` 静态访问 |
| 认证 | 本地账号密码 + JWT 令牌，作者归属在 SQL 层校验 |

---

## 📁 目录结构

```
.
├── frontend/                     # 前端应用
│   ├── src/
│   │   ├── components/
│   │   │   ├── blog/            # 博客组件（卡片、标签、Markdown 渲染等）
│   │   │   └── ui/              # shadcn/ui 基础组件
│   │   ├── pages/               # 页面组件
│   │   │   ├── Home.tsx         # 首页
│   │   │   ├── PostDetail.tsx   # 文章详情
│   │   │   ├── Tags.tsx         # 标签总览
│   │   │   ├── TagDetail.tsx    # 标签详情
│   │   │   ├── About.tsx        # 关于
│   │   │   ├── Search.tsx       # 搜索
│   │   │   ├── Login.tsx        # 登录 / 注册
│   │   │   ├── Write.tsx        # 写文章
│   │   │   ├── MyPosts.tsx      # 我的文章
│   │   │   └── NotFound.tsx     # 404
│   │   ├── hooks/               # 数据请求 hooks（REST 接口封装）
│   │   ├── lib/                 # 工具库（API 客户端、认证上下文、格式化）
│   │   ├── types/               # TypeScript 类型定义
│   │   └── index.css            # 设计系统与全局样式
│   ├── Dockerfile               # 前端生产镜像
│   ├── nginx.conf.template      # Nginx 站点模板（SPA 回退 + API 反代）
│   └── vite.config.ts
│
├── backend/                      # 后端服务
│   ├── src/
│   │   ├── modules/             # 业务模块（blog / auth / upload）
│   │   ├── middleware/          # 中间件（JWT 认证等）
│   │   ├── config/              # 配置（环境变量、数据库、日志器）
│   │   ├── scripts/             # 种子数据导入脚本
│   │   ├── app.ts               # Express 应用装配
│   │   └── index.ts             # 服务入口
│   ├── data/blog.db             # SQLite 数据库文件（运行时生成）
│   ├── uploads/                 # 上传的图片与附件（运行时生成）
│   └── Dockerfile               # 后端生产镜像
│
├── scripts/
│   ├── start-local.sh           # 本地一键启动（前后端 + 数据库初始化）
│   └── deploy.sh                # 容器化部署脚本
│
├── docs/
│   ├── product/features.md      # 产品需求文档
│   ├── design/                  # 设计系统与样式指南
│   └── project.json             # 项目元信息
│
└── LICENSE                      # MIT 开源协议
```

---

## 🚀 快速开始

### 环境要求

- **Node.js** ≥ 22（依赖内置 `node:sqlite`）
- **pnpm** ≥ 9（推荐）或 npm

> 不需要任何云账号、不需要 Docker、不需要单独安装数据库。

### 一键启动（推荐）

```bash
git clone https://github.com/chengerr0817-cloud/-.git
cd -

# 自动安装依赖 + 初始化数据库（首次会导入 7 篇示例文章）+ 启动前后端
./scripts/start-local.sh
```

启动后访问 **http://localhost:5173** 即可。

也可以分开启动：

```bash
./scripts/start-local.sh backend   # 只启后端 :3000
./scripts/start-local.sh frontend  # 只启前端 :5173
```

### 分步启动

#### 1. 克隆项目

```bash
git clone https://github.com/chengerr0817-cloud/-.git
cd -
```

#### 2. 安装依赖

```bash
cd frontend && pnpm install && cd ..
cd backend  && pnpm install && cd ..
```

#### 3. 初始化数据库（导入示例文章）

```bash
cd backend && pnpm run seed
```

这一步会创建 `backend/data/blog.db`，建表并写入 7 篇示例文章与 7 个标签，
同时创建默认账号：

| 用户名 | 密码 |
|--------|------|
| `admin` | `moji123456` |

> ⚠️ 这是演示账号，请登录后自行注册正式账号使用。

#### 4. 启动后端（端口 3000）

```bash
cd backend
PORT=3000 JWT_SECRET=your-secret-here npx tsx src/index.ts
```

#### 5. 启动前端（端口 5173）

另开一个终端：

```bash
cd frontend
npx vite --host :: --port 5173
```

打开 **http://localhost:5173** 即可看到博客首页。

### 可配置的环境变量

后端（可选，均有合理默认值）：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3000` | 后端监听端口 |
| `JWT_SECRET` | 内置开发密钥 | **生产环境务必修改** |
| `DB_PATH` | `backend/data/blog.db` | SQLite 数据库文件路径 |
| `UPLOAD_DIR` | `backend/uploads` | 上传文件存放目录 |

前端（可选）：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `BACKEND_PORT` | `3000` | 开发代理指向的后端端口 |

> `.env` 文件已被 `.gitignore` 忽略，**切勿提交到仓库**。

### 生产构建

```bash
# 前端构建为静态文件（输出到 frontend/dist）
cd frontend && pnpm build

# 后端编译为 JS（输出到 backend/dist）
cd backend && pnpm build
```

生产模式下，后端会自动托管 `frontend/dist`，因此只需启动后端一个进程：

```bash
cd backend
NODE_ENV=production JWT_SECRET=your-strong-secret node dist/index.js
```

浏览器访问 **http://localhost:3000** 即可。

---

## 📦 容器化部署（可选）

项目自带前后端 Dockerfile，适合部署到任意支持容器的平台。

```bash
./scripts/deploy.sh --local   # 本地构建镜像并串联，访问 http://localhost:8080
```

| 文件 | 说明 |
|------|------|
| `backend/Dockerfile` | 后端生产镜像（多阶段、非 root、健康检查） |
| `frontend/Dockerfile` | 前端生产镜像（构建 + Nginx） |
| `frontend/nginx.conf.template` | SPA 回退 + `/api` 反向代理 |

> ⚠️ **上线前必做**：修改 `JWT_SECRET`；把 `backend/data/` 与 `backend/uploads/`
> 挂载为持久化卷，否则容器重建会丢失数据。

---

## ⚙️ 环境变量一览

### 后端（运行期注入）

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `NODE_ENV` | ⬜ | `development` | 生产环境设为 `production` |
| `PORT` | ⬜ | `3000` | 监听端口 |
| `API_PREFIX` | ⬜ | `/api` | API 路由前缀 |
| `CORS_ORIGIN` | ⬜ | `*` | 允许来源，生产环境**务必填具体域名** |
| `JWT_SECRET` | ✅ | 内置开发密钥 | JWT 签名密钥，**生产必须修改** |
| `DB_PATH` | ⬜ | `backend/data/blog.db` | SQLite 数据库文件路径 |
| `UPLOAD_DIR` | ⬜ | `backend/uploads` | 上传文件目录 |

### 前端（开发期可选）

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `BACKEND_PORT` | ⬜ | `3000` | 开发代理指向的后端端口 |

---

## 🔌 API 接口一览

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| `GET` | `/api/health` | — | 健康检查 |
| `GET` | `/api/blog/posts` | 可选 | 文章列表（分页 `page` / `limit`） |
| `GET` | `/api/blog/posts/hot` | — | 热门文章 |
| `GET` | `/api/blog/posts/:slug` | — | 文章详情（含标签与相关文章） |
| `GET` | `/api/blog/tags` | — | 全部标签（含文章数） |
| `GET` | `/api/blog/stats` | — | 站点统计 |
| `POST` | `/api/blog/views/:slug` | — | 浏览量 +1 |
| `POST` | `/api/auth/register` | — | 注册（首个账号自动成为拥有者） |
| `POST` | `/api/auth/login` | — | 登录，返回 JWT |
| `GET` | `/api/auth/me` | ✅ | 当前登录用户 |
| `GET` | `/api/auth/status` | — | 站点是否已有账号 |
| `GET` | `/api/blog/my/posts` | ✅ | 我的文章（含草稿） |
| `GET` | `/api/blog/my/posts/:id/tags` | ✅ | 读取文章标签名 |
| `POST` | `/api/blog/posts` | ✅ | 新建文章 |
| `PUT` | `/api/blog/posts/:id` | ✅ | 更新文章 |
| `DELETE` | `/api/blog/posts/:id` | ✅ | 删除文章 |
| `POST` | `/api/upload` | ✅ | 上传图片 / 附件（≤10MB） |


## 🔐 安全说明

- **密码加盐哈希**：使用 bcrypt（cost 10）存储，任何情况下不回传明文
- **JWT 签名**：生产环境必须通过 `JWT_SECRET` 注入强随机密钥，切勿沿用开发默认值
- **作者归属校验在 SQL 层**：更新/删除文章时校验 `user_id`，非作者一律 404
- **上传白名单**：限制后缀与 10MB 体积，文件名随机化，避免路径穿越
- **生产环境 CORS** 必须指定具体域名，不要用 `*`
- **数据与上传目录不进仓库**：`.gitignore` 已排除 `backend/data/`、`backend/uploads/`、`.env*`
- **容器非 root 运行**：后端镜像已配置

---

## 🤝 贡献

欢迎提交 Issue 与 Pull Request。开始前请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。

---

## 📄 开源协议

本项目基于 [MIT License](./LICENSE) 开源。
