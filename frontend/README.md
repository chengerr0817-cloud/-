# 墨迹 · 前端

React 19 + TypeScript + Vite 单页应用，通过 REST 接口访问本地后端。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 7 |
| 样式 | Tailwind CSS v4 + shadcn/ui（Radix UI） |
| 路由 | React Router v7 |
| 数据 | Axios（自定义 hooks 封装） |
| Markdown | react-markdown + remark-gfm + rehype-highlight + rehype-raw |
| 动画 | Framer Motion |
| 图标 | Lucide React |

## 目录结构

```
frontend/src/
├── components/
│   ├── blog/            # 博客组件（卡片、标签、Markdown 渲染、导航）
│   └── ui/              # shadcn/ui 基础组件
├── pages/               # 页面
│   ├── Home.tsx         # 首页（文章流）
│   ├── PostDetail.tsx   # 文章详情
│   ├── Tags.tsx         # 标签总览
│   ├── TagDetail.tsx    # 标签详情
│   ├── About.tsx        # 关于
│   ├── Search.tsx       # 搜索
│   ├── Login.tsx        # 登录 / 注册
│   ├── Write.tsx        # 写文章 / 编辑
│   ├── MyPosts.tsx      # 我的文章
│   └── NotFound.tsx     # 404
├── hooks/
│   └── usePosts.ts      # 全部数据请求 hooks（REST 封装）
├── lib/
│   ├── api-client.ts    # Axios 实例 + JWT 注入 + 错误处理
│   ├── AuthContext.tsx  # 登录态上下文
│   └── blog-utils.ts    # slug / 阅读时长 / 日期格式化
├── types/
│   └── blog.ts          # 与后端一致的类型定义
└── index.css            # 设计系统与全局样式
```

## 开发

```bash
pnpm install
pnpm dev              # http://localhost:5173
```

开发服务器会把 `/api` 与 `/uploads` 代理到后端 `http://localhost:3000`
（可用环境变量 `BACKEND_PORT` 覆盖）。

> 需要先启动后端，见根目录 `README.md`。

## 构建

```bash
pnpm build            # 类型检查 + 产出 dist/
pnpm preview          # 本地预览构建产物
```

生产构建产物为纯静态文件，可由任意静态服务器托管；
也可以直接由后端托管（后端会自动读取 `../frontend/dist`）。

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `BACKEND_PORT` | `3000` | 开发代理指向的后端端口 |

## 设计系统

- **色彩**：暖琥珀主题，基于 oklch
- **字体**：衬线标题（Playfair Display）+ 无衬线正文（Inter）
- **Markdown 样式**：`.prose-moji` 类，代码高亮由 `.hljs-*` 控制
- 全部设计变量定义在 `src/index.css`
