import { sql } from '../config/database.js'

/* ------------------------------------------------------------------ *
 * 类型
 * ------------------------------------------------------------------ */

export interface Tag {
  id: number
  name: string
  slug: string
  color: string
}

export interface Post {
  id: number
  user_id: number | null
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

export interface PostWithTags extends Post {
  tags: Tag[]
}

/* ------------------------------------------------------------------ *
 * 工具
 * ------------------------------------------------------------------ */

function nowSql(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

function tagsOf(postId: number): Tag[] {
  return sql.all<Tag>(
    `SELECT t.id, t.name, t.slug, t.color
       FROM tags t
       JOIN post_tags pt ON pt.tag_id = t.id
      WHERE pt.post_id = ?
      ORDER BY t.name`,
    postId
  )
}

function attachTags(posts: Post[]): PostWithTags[] {
  return posts.map((p) => ({ ...p, tags: tagsOf(p.id) }))
}

/* ------------------------------------------------------------------ *
 * 查询
 * ------------------------------------------------------------------ */

export function listPosts(
  limit: number,
  offset: number,
  includeDrafts: boolean
): { items: PostWithTags[]; total: number } {
  const where = includeDrafts ? '' : `WHERE status = 'published'`
  const rows = sql.all<Post>(
    `SELECT * FROM posts ${where}
      ORDER BY COALESCE(published_at, created_at) DESC
      LIMIT ? OFFSET ?`,
    limit,
    offset
  )
  const total = sql.get<{ c: number }>(`SELECT COUNT(*) AS c FROM posts ${where}`)?.c ?? 0
  return { items: attachTags(rows), total }
}

export function getPostDetail(slug: string) {
  const post = sql.get<Post>(`SELECT * FROM posts WHERE slug = ?`, slug)
  if (!post) return { found: false as const }

  const tags = tagsOf(post.id)
  const tagIds = tags.map((t) => t.id)

  let related: Partial<Post>[] = []
  if (tagIds.length > 0) {
    const placeholders = tagIds.map(() => '?').join(',')
    related = sql.all<Partial<Post>>(
      `SELECT DISTINCT p.id, p.title, p.slug, p.summary, p.cover_url, p.published_at, p.read_minutes
         FROM posts p
         JOIN post_tags pt ON pt.post_id = p.id
        WHERE pt.tag_id IN (${placeholders})
          AND p.id != ?
          AND p.status = 'published'
        ORDER BY COALESCE(p.published_at, p.created_at) DESC
        LIMIT 3`,
      ...tagIds,
      post.id
    )
  }
  return { found: true as const, post, tags, related }
}

export function listTags() {
  return sql.all(
    `SELECT t.id, t.name, t.slug, t.color,
            COUNT(CASE WHEN p.status = 'published' THEN 1 END) AS post_count
       FROM tags t
       LEFT JOIN post_tags pt ON pt.tag_id = t.id
       LEFT JOIN posts p ON p.id = pt.post_id
      GROUP BY t.id
      ORDER BY post_count DESC, t.name`
  )
}

export function siteStats() {
  const r = sql.get<{ post_count: number; draft_count: number; total_views: number }>(
    `SELECT
       COUNT(CASE WHEN status='published' THEN 1 END) AS post_count,
       COUNT(CASE WHEN status='draft' THEN 1 END)     AS draft_count,
       COALESCE(SUM(views), 0)                        AS total_views
     FROM posts`
  ) ?? { post_count: 0, draft_count: 0, total_views: 0 }

  const tag_count = sql.get<{ c: number }>(`SELECT COUNT(*) AS c FROM tags`)?.c ?? 0
  const total_words =
    sql.get<{ c: number }>(
      `SELECT COALESCE(SUM(LENGTH(content)),0) AS c FROM posts WHERE status='published'`
    )?.c ?? 0

  return { ...r, tag_count, total_words }
}

export function listMyPosts(userId: number) {
  const rows = sql.all<Post>(
    `SELECT * FROM posts WHERE user_id = ? ORDER BY updated_at DESC`,
    userId
  )
  return attachTags(rows)
}

export function hotPosts(limit: number) {
  return sql.all<Partial<Post>>(
    `SELECT id, title, slug, summary, cover_url, views, read_minutes, published_at
       FROM posts WHERE status='published'
      ORDER BY views DESC LIMIT ?`,
    limit
  )
}

/* ------------------------------------------------------------------ *
 * 标签同步
 * ------------------------------------------------------------------ */

function slugifyTag(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '')
}

export function syncTags(postId: number, tagNames: string[]): void {
  sql.run(`DELETE FROM post_tags WHERE post_id = ?`, postId)
  const clean = Array.from(new Set(tagNames.map((t) => t.trim()).filter(Boolean)))
  if (clean.length === 0) return

  for (const name of clean) {
    let row = sql.get<{ id: number }>(`SELECT id FROM tags WHERE name = ?`, name)
    if (!row) {
      sql.run(`INSERT INTO tags (name, slug, color) VALUES (?, ?, 'amber')`, name, slugifyTag(name))
      row = sql.get<{ id: number }>(`SELECT id FROM tags WHERE name = ?`, name)
    }
    if (row) sql.run(`INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)`, postId, row.id)
  }
}

export function tagNamesOf(postId: number): string[] {
  return sql
    .all<{ name: string }>(
      `SELECT t.name FROM tags t JOIN post_tags pt ON pt.tag_id=t.id WHERE pt.post_id=?`,
      postId
    )
    .map((r) => r.name)
}

/* ------------------------------------------------------------------ *
 * 写入
 * ------------------------------------------------------------------ */

export interface PostInput {
  title: string
  slug: string
  summary?: string | null
  content?: string | null
  cover_url?: string | null
  status: 'draft' | 'published'
  read_minutes?: number
  author_name?: string | null
}

export function createPost(userId: number, input: PostInput): number {
  const info = sql.run(
    `INSERT INTO posts (user_id, title, slug, summary, content, cover_url, status, read_minutes, author_name, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    userId,
    input.title,
    input.slug,
    input.summary ?? null,
    input.content ?? null,
    input.cover_url ?? null,
    input.status,
    input.read_minutes ?? 1,
    input.author_name ?? null,
    input.status === 'published' ? nowSql() : null
  )
  return Number(info.lastInsertRowid)
}

export function updatePost(id: number, userId: number, input: Partial<PostInput>): boolean {
  const existing = sql.get<Post>(`SELECT * FROM posts WHERE id = ?`, id)
  if (!existing || existing.user_id !== userId) return false

  const merged = {
    title: input.title ?? existing.title,
    slug: input.slug ?? existing.slug,
    summary: input.summary !== undefined ? input.summary : existing.summary,
    content: input.content !== undefined ? input.content : existing.content,
    cover_url: input.cover_url !== undefined ? input.cover_url : existing.cover_url,
    status: input.status ?? existing.status,
    read_minutes: input.read_minutes ?? existing.read_minutes,
    author_name: input.author_name !== undefined ? input.author_name : existing.author_name,
    published_at:
      input.status === 'published' && !existing.published_at ? nowSql() : existing.published_at,
  }

  sql.run(
    `UPDATE posts SET title=?, slug=?, summary=?, content=?, cover_url=?, status=?,
       read_minutes=?, author_name=?, published_at=?, updated_at=?
     WHERE id=?`,
    merged.title,
    merged.slug,
    merged.summary,
    merged.content,
    merged.cover_url,
    merged.status,
    merged.read_minutes,
    merged.author_name,
    merged.published_at,
    nowSql(),
    id
  )
  return true
}

export function deletePost(id: number, userId: number): boolean {
  const existing = sql.get<{ user_id: number }>(`SELECT user_id FROM posts WHERE id = ?`, id)
  if (!existing || existing.user_id !== userId) return false
  sql.run(`DELETE FROM posts WHERE id = ?`, id)
  return true
}

export function incViews(slug: string): void {
  sql.run(`UPDATE posts SET views = views + 1 WHERE slug = ?`, slug)
}
