<div align="center">

# 墨迹 · MoJi

**在代码与思考之间，留下成长的墨迹。**

一个全栈个人技术博客 —— 记录技术学习与个人成长的思考笔记。

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![CloudBase](https://img.shields.io/badge/Tencent-CloudBase-0052D9)](https://cloudbase.net/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

</div>

---

## 📖 项目简介

**墨迹** 是一个面向开发者与写作者的个人博客系统。它以「技术成长」为主题，采用暖琥珀色的编辑风格设计，兼顾阅读体验与写作效率。

项目采用**前后端分离 + 全云端数据层**架构：

- **前端**：React 19 单页应用，负责界面渲染、Markdown 展示与交互
- **后端**：Express API 服务，承担聚合查询与鉴权写入
- **数据层**：腾讯云开发（TCB）托管 PostgreSQL + 云存储 + 认证 —— 无需自建数据库

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
- ☁️ **图片/附件上传** — 直传云端存储
- 🎨 **编辑器预处理** — 自动生成 slug、估算阅读时长

### 认证与安全

- 🔐 **Google OAuth 登录** — 一键授权登录
- 📧 **邮箱验证码登录** — 无需密码
- 🛡️ **路由守卫** — 写文章 / 我的文章等页面需登录访问
- 🔒 **数据库行级安全（RLS）** — 权限在数据层强制执行：
  已发布文章公开可读、草稿仅作者可见、写操作仅限作者本人

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
| 校验 | Zod |
| 日志 | Pino |
| 构建 | tsc（NodeNext / ESM） |

### 云端（腾讯云开发 TCB）

| 能力 | 用途 |
|------|------|
| 托管 PostgreSQL | 文章、标签、评论数据存储 |
| 云存储 | 图片与附件 |
| 认证 | Google OAuth + 邮箱验证码 |
| 行级安全（RLS） | 数据库层权限控制 |

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
│   │   │   ├── Login.tsx        # 登录
│   │   │   ├── Write.tsx        # 写文章
│   │   │   ├── MyPosts.tsx      # 我的文章
│   │   │   ├── NotFound.tsx     # 404
│   │   │   └── AuthCallback.tsx # OAuth 回调
│   │   ├── hooks/               # 数据请求 hooks
│   │   ├── lib/                 # 工具库（TCB 客户端、认证、存储等）
│   │   ├── types/               # TypeScript 类型定义
│   │   └── index.css            # 设计系统与全局样式
│   ├── Dockerfile               # 前端生产镜像
│   ├── nginx.conf.template      # Nginx 站点模板（SPA 回退 + API 反代）
│   └── vite.config.ts
│
├── backend/                      # 后端服务
│   ├── src/
│   │   ├── modules/             # 业务模块
│   │   ├── middleware/          # 中间件（认证、日志、错误处理）
│   │   ├── config/              # 配置（环境变量、日志器）
│   │   ├── app.ts               # Express 应用装配
│   │   └── index.ts             # 服务入口
│   └── Dockerfile               # 后端生产镜像
│
├── scripts/
│   └── deploy.sh                # 一键部署脚本
│
├── docs/
│   ├── product/features.md      # 产品需求文档
│   ├── design/                  # 设计系统与样式指南
│   └── project.json             # 项目元信息
│
├── cloudbaserc.json             # 腾讯云开发部署配置
├── DEPLOY.md                    # 部署指南
└── LICENSE                      # MIT 开源协议
```

---

## 🚀 快速开始

### 环境要求

- **Node.js** ≥ 20
- **pnpm** ≥ 9（推荐）或 npm
- 一个腾讯云开发（TCB）环境（用于数据库、存储与认证）

### 1. 克隆项目

```bash
git clone https://github.com/chengerr0817-cloud/-.git
cd -
```

### 2. 配置环境变量

复制示例文件并填入你的 TCB 凭据：

```bash
# 前端
cp frontend/.env.example frontend/.env

# 后端
cp backend/.env.example backend/.env
```

需要填写的变量：

| 变量 | 说明 | 在哪儿找 |
|------|------|----------|
| `CLOUDBASE_ENV_ID` / `VITE_CLOUDBASE_ENV_ID` | TCB 环境 ID | TCB 控制台 → 环境概览 |
| `CLOUDBASE_REGION` | 环境地域 | 如 `ap-shanghai` |
| `CLOUDBASE_PUBLISH_KEY` / `VITE_CLOUDBASE_PUBLISH_KEY` | 匿名访问令牌 | TCB 控制台 → 环境 → 访问密钥 |
| `VITE_OAUTH_RELAY_URL` | OAuth 中转地址 | 按你的部署环境填写 |

> ⚠️ `.env` 文件已被 `.gitignore` 忽略，**切勿提交到仓库**。

### 3. 安装依赖

```bash
cd frontend && pnpm install && cd ..
cd backend  && pnpm install && cd ..
```

### 4. 启动开发环境

```bash
# 后端（默认 http://localhost:3000）
cd backend && pnpm dev

# 前端（默认 http://localhost:5173，已配置 /api 代理到后端）
cd frontend && pnpm dev
```

浏览器打开 http://localhost:5173 即可访问。

---

## 📦 构建与部署

详见 **[DEPLOY.md](./DEPLOY.md)**。简要流程：

### 一键本地容器验证

```bash
./scripts/deploy.sh --local      # 构建前后端镜像并串联，访问 http://localhost:8080
```

### 部署到腾讯云开发

```bash
# 前端 → 静态托管
./scripts/deploy.sh --frontend

# 后端 → 云托管
tcb run deploy moji-backend --path ./backend --port 3000
```

### 需要准备的部署文件

| 文件 | 说明 |
|------|------|
| `backend/Dockerfile` | 后端生产镜像（多阶段、非 root、健康检查） |
| `frontend/Dockerfile` | 前端生产镜像（构建 + Nginx） |
| `frontend/nginx.conf.template` | SPA 回退 + `/api` 反向代理 |
| `cloudbaserc.json` | 云开发 CLI 部署配置 |

> ⚠️ **上线前必做**：在后端服务注入 `CLOUDBASE_ENV_ID`、`CLOUDBASE_PUBLISH_KEY` 等环境变量，
> 并在 TCB 控制台把生产域名加入 **OAuth 回调白名单** 与 **安全域名白名单**。

---

## ⚙️ 环境变量一览

### 前端（构建期注入）

| 变量 | 必填 | 说明 |
|------|------|------|
| `VITE_CLOUDBASE_ENV_ID` | ✅ | TCB 环境 ID |
| `VITE_CLOUDBASE_REGION` | ⬜ | 地域，默认 `ap-shanghai` |
| `VITE_CLOUDBASE_PUBLISH_KEY` | ✅ | 匿名访问令牌 |
| `VITE_OAUTH_RELAY_URL` | ⬜ | OAuth 中转地址 |

### 后端（运行期注入）

| 变量 | 必填 | 说明 |
|------|------|------|
| `NODE_ENV` | ⬜ | `development` / `production`，默认 `development` |
| `PORT` | ⬜ | 监听端口，默认 `3000` |
| `API_PREFIX` | ⬜ | API 前缀，默认 `/api` |
| `CORS_ORIGIN` | ⬜ | 允许来源，生产环境**务必填具体域名** |
| `CLOUDBASE_ENV_ID` | ✅ | TCB 环境 ID |
| `CLOUDBASE_REGION` | ⬜ | 地域，默认 `ap-shanghai` |
| `CLOUDBASE_PUBLISH_KEY` | ✅ | 匿名访问令牌 |

---

## 🔐 安全说明

- **`.env` / `.env.tcb` 不提交**：已在 `.gitignore` 中排除
- **publish key 是可公开的受限令牌**：它被设计用于前端，RLS 以 `anon` 角色执行；
  数据库管理密钥等敏感凭据**绝不**能走 `VITE_` 前缀
- **RLS 是权限最后防线**：部署时**不要**关闭数据表的行级安全策略
- **生产环境 CORS** 必须指定具体域名，不要用 `*`
- **容器非 root 运行**：后端镜像已配置

---

## 🤝 贡献

欢迎提交 Issue 与 Pull Request。开始前请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。

---

## 📄 开源协议

本项目基于 [MIT License](./LICENSE) 开源。
