# 墨迹 · 技术成长博客 — 产品需求文档

> 一句话定位：一个面向技术写作者的极简个人博客平台 —— 用温暖的琥珀色调承载理性的技术思考。

---

## 1. 产品概述

**产品名称**：墨迹（MoJi）
**博客主题**：技术成长博客（前端工程 / 后端架构 / AI 应用 / 工程方法论）
**目标用户**：
- 主要角色：博主本人（内容创作者），需要一套顺手的写作、编辑、发布工具
- 次要角色：读者（技术同行），需要舒适的阅读体验与高效的内容检索

**核心价值**：
1. **写得顺** —— Markdown 原生写作，图片拖拽上传，草稿/发布状态管理
2. **读得爽** —— 编辑级排版（衬线大标题 + 无衬线正文），代码高亮，阅读进度
3. **找得到** —— 标签分类体系 + 关键词搜索 + 归档时间线

**设计基调**：Swiss Modernism 2.0 × 温暖琥珀（Warm Amber Editorial）
- 主色 `#D97706`（琥珀橙），背景 `#FFFBEB`（暖米白），正文 `#451A03`（深棕）
- 标题字体 Playfair Display（衬线，编辑感），正文字体 Inter（无衬线，可读性）
- 大量留白、网格化排版、克制的动效

---

## 2. 核心功能

### 2.1 文章系统
| 功能 | 说明 |
|------|------|
| 文章列表 | 首页卡片流，支持分页；展示封面图、标题、摘要、作者、日期、阅读时长、标签 |
| 文章详情 | Markdown 渲染（支持 GFM 表格/任务列表/代码块高亮）、阅读进度条、目录锚点、相关文章推荐 |
| 文章搜索 | 按标题/内容关键词检索 |
| 阅读计数 | 每次打开详情页自增阅读量 |

### 2.2 标签分类
| 功能 | 说明 |
|------|------|
| 标签总览 | 标签云，按文章数量排序，展示每个标签下的文章数 |
| 标签详情 | 点击标签查看该标签下所有已发布文章 |

### 2.3 写作与管理（需登录）
| 功能 | 说明 |
|------|------|
| 新建文章 | Markdown 编辑器 + 实时预览，封面图上传 |
| 编辑文章 | 修改自己的文章，仅作者可编辑 |
| 草稿/发布 | 状态切换：`draft`（仅作者可见）/ `published`（公开） |
| 我的文章 | 管理列表，查看草稿与已发布，支持删除 |
| 附件上传 | 图片上传到云存储，返回直链插入 Markdown |

### 2.4 登录认证
| 功能 | 说明 |
|------|------|
| 邮箱验证码登录 | 输入邮箱 → 收验证码 → 登录/自动注册 |
| Google 登录 | OAuth 一键登录 |
| 会话保持 | 令牌自动持久化与刷新 |
| 路由守卫 | 写作/管理页需登录，未登录跳转登录页 |

### 2.5 关于页面
- 博主简介、技能标签、社交链接（GitHub / 邮箱 / RSS）
- 站点统计（文章总数、标签总数、累计阅读）

---

## 3. 用户故事

| 角色 | 故事 | 验收标准 |
|------|------|----------|
| 读者 | 我想浏览最新文章 | 首页按发布时间倒序展示已发布文章，支持翻页 |
| 读者 | 我想按标签找文章 | 标签页展示所有标签及数量，点击进入标签详情 |
| 读者 | 我想搜索一篇记得标题的文章 | 输入关键词能匹配标题与正文 |
| 读者 | 我想舒服地读一篇长文 | Markdown 正确渲染，代码高亮，有阅读进度提示 |
| 博主 | 我想登录后写文章 | 登录后可进入编辑器，支持实时预览 |
| 博主 | 我想上传配图 | 选择本地图片上传到云存储，自动插入 Markdown 语法 |
| 博主 | 我想先存草稿 | 文章可保存为草稿，草稿不出现在公开列表 |
| 博主 | 我想改自己的文章 | 只有作者能编辑/删除自己的文章 |
| 博主 | 我想维护标签 | 写文章时输入标签，标签自动创建并关联 |

---

## 4. 页面结构

```
/                      首页 —— Hero + 文章列表（分页）+ 侧边栏（标签云/最新）
/posts/:slug           文章详情 —— Markdown 正文 + 阅读进度 + 作者卡片 + 相关文章
/tags                  标签总览 —— 标签云网格
/tags/:tagName         标签详情 —— 该标签下的文章列表
/about                 关于 —— 博主简介 + 技能 + 站点统计
/search                搜索结果 —— 关键词匹配的文章列表
/login                 登录/注册 —— 邮箱验证码 + Google OAuth
/auth/callback         OAuth 回调 —— 处理登录态（自动）
/write                 新建文章（需登录）
/edit/:id              编辑文章（需登录，仅作者）
/me/posts              我的文章管理（需登录）
```

**共享布局**（置于 `AnimatedRoutes` 外部）：`Navbar`（Logo + 导航 + 搜索 + 用户菜单）、`Footer`

---

## 5. 数据模型

### 5.1 `posts`（文章表）
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT IDENTITY | 主键 |
| `user_id` | TEXT | 作者 ID（`DEFAULT auth.uid()`） |
| `title` | TEXT | 标题 |
| `slug` | TEXT | URL 别名（唯一） |
| `summary` | TEXT | 摘要 |
| `content` | TEXT | Markdown 正文 |
| `cover_url` | TEXT | 封面图 URL（云存储） |
| `status` | TEXT | `draft` / `published` |
| `views` | INTEGER | 阅读量（默认 0） |
| `read_minutes` | INTEGER | 预计阅读分钟数 |
| `author_name` | TEXT | 作者昵称（冗余，便于公开展示） |
| `created_at` | TIMESTAMPTZ | 创建时间 |
| `updated_at` | TIMESTAMPTZ | 更新时间 |
| `published_at` | TIMESTAMPTZ | 发布时间 |

### 5.2 `tags`（标签表）
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT IDENTITY | 主键 |
| `user_id` | TEXT | 创建者（`DEFAULT auth.uid()`，公开读） |
| `name` | TEXT | 标签名（唯一） |
| `slug` | TEXT | URL 别名 |
| `color` | TEXT | 标签色 |
| `created_at` | TIMESTAMPTZ | 创建时间 |

### 5.3 `post_tags`（文章-标签关联表）
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT IDENTITY | 主键 |
| `post_id` | BIGINT | 文章 ID |
| `tag_id` | BIGINT | 标签 ID |

### 5.4 `comments`（评论表，预留）
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT IDENTITY | 主键 |
| `user_id` | TEXT | 评论者（`DEFAULT auth.uid()`） |
| `post_id` | BIGINT | 文章 ID |
| `author_name` | TEXT | 评论者昵称 |
| `content` | TEXT | 评论内容 |
| `created_at` | TIMESTAMPTZ | 创建时间 |

### 5.5 RLS 策略总览
| 表 | anon 读 | authenticated 读 | 写 |
|----|---------|------------------|-----|
| `posts` | 仅 `published` | `published` 或自己的草稿 | 仅作者本人增删改 |
| `tags` | 全部 | 全部 | 登录用户可创建 |
| `post_tags` | 全部 | 全部 | 仅关联自己文章时 |
| `comments` | 全部 | 全部 | 评论仅作者可删，登录可发 |

---

## 6. API 端点设计

> 遵循 JSON 协议：数据操作一律 POST + JSON body；标准 CRUD 走前端 TCB SDK（`app.rdb()`）。

### 6.1 前端 SDK 直连（主要路径）
| 操作 | 方式 | 说明 |
|------|------|------|
| 文章列表 | `db.from('posts').select()` | 过滤 `status=published`，按 `published_at` 倒序，`range` 分页 |
| 文章详情 | `db.from('posts').select().eq('slug', x).single()` | 按 slug 查询 |
| 我的文章 | `db.from('posts').select().eq('user_id', uid)` | 含草稿 |
| 创建/更新/删除 | `db.from('posts').insert/update/delete` | RLS 保证仅作者可写 |
| 标签列表 | `db.from('tags').select()` | 全部标签 |
| 标签关联 | `db.from('post_tags').select('*, tag:tags(*)')` | 外键联表 |

### 6.2 PostgreSQL 函数（RPC，复杂聚合）
| 函数名 | 返回 | 说明 |
|--------|------|------|
| `list_posts_with_tags(p_status, p_limit, p_offset)` | json | 文章列表 + 标签聚合 + 总数 |
| `get_post_detail(p_slug)` | json | 文章详情 + 标签 + 相关文章 |
| `list_tags_with_count()` | json | 标签 + 各标签文章数 |
| `get_site_stats()` | json | 站点统计（文章数/标签数/总阅读） |
| `increment_post_views(p_slug)` | json | 阅读量自增 |

### 6.3 后端接口（Express，辅助）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| POST | `/api/posts/hot` | 热门文章（按阅读量排序，服务端聚合） |
| POST | `/api/stats/site` | 站点统计（可选，RPC 优先） |

---

## 7. 非功能需求

- **响应式**：375 / 768 / 1024 / 1440 四档断点适配
- **可访问性**：正文对比度 ≥ 4.5:1，键盘可导航，焦点态可见，尊重 `prefers-reduced-motion`
- **SEO**：每页唯一 H1、语义化标签、`<title>` ≤ 60 字符、meta description ≤ 160 字符、文章页 JSON-LD
- **性能**：图片懒加载 + 云存储 CDN；列表分页；TanStack Query 缓存
- **设计系统**：所有业务代码使用 CSS 变量（颜色 / 字号 / 间距 / 阴影 / 圆角），不硬编码

---

## 8. 云能力映射

| 需求 | TCB 能力 |
|------|----------|
| 文章数据存储 | TCB 托管 PostgreSQL（`app.rdb()` + RLS） |
| 图片/附件存储 | TCB 云存储（`app.uploadFile()` → 直链） |
| 登录认证 | TCB Auth（邮箱验证码 + Google OAuth + 自定义登录） |
| 复杂查询 | PostgreSQL 函数 + RPC |
