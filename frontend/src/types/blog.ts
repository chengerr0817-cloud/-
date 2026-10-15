/**
 * 与后端 SQLite 数据层（backend/src/modules/blog-repo.ts）保持一致的类型定义。
 * 新架构下所有数据均来自本地 REST 接口 `/api/blog/*`。
 */

/** 标签（含可选的文章数，仅在标签列表接口返回）。 */
export interface Tag {
  id: number
  name: string
  slug: string
  color: string
  /** 仅 GET /api/blog/tags 返回 */
  post_count?: number
}

/** 带文章数的标签（标签列表页使用）。 */
export type TagWithCount = Tag & { post_count: number }

/** 一篇文章行。 */
export interface Post {
  id: number
  user_id?: number | null
  title: string
  slug: string
  summary: string | null
  content: string | null
  cover_url: string | null
  status: 'draft' | 'published'
  views: number
  read_minutes: number
  author_name: string | null
  created_at: string
  updated_at: string
  published_at: string | null
}

/** 携带标签的文章（列表 / 我的文章视图）。 */
export interface PostWithTags extends Post {
  tags: Tag[]
}

/** 相关文章卡片（详情页底部推荐）。 */
export interface RelatedPost {
  id: number
  title: string
  slug: string
  summary: string | null
  cover_url: string | null
  published_at: string | null
  read_minutes: number
}

/** GET /api/blog/posts/:slug 的返回结构。 */
export interface PostDetailResult {
  found: true
  post: Post
  tags: Tag[]
  related: RelatedPost[]
}

/** GET /api/blog/posts 的返回结构。 */
export interface PostListResult {
  items: PostWithTags[]
  total: number
}

/** GET /api/blog/stats 的返回结构。 */
export interface SiteStats {
  post_count: number
  draft_count: number
  tag_count: number
  total_views: number
  total_words: number
}
