/**
 * 数据迁移：把从云端导出的文章 JSON 灌入本地 SQLite。
 *
 * 用法：npx tsx src/scripts/seed.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import { sql, initSchema } from '../config/database.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface SeedPost {
  title: string
  slug: string
  summary?: string | null
  content?: string | null
  cover_url?: string | null
  status?: string
  views?: number
  read_minutes?: number
  author_name?: string | null
  published_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  tags?: string[]
}

function slugifyTag(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '')
}

function main() {
  initSchema()

  // 1. 确保有一个作者账号
  let userId: number
  const userCount = sql.get<{ c: number }>(`SELECT COUNT(*) AS c FROM users`)?.c ?? 0
  if (userCount === 0) {
    const hash = bcrypt.hashSync('moji123456', 10)
    const info = sql.run(
      `INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)`,
      'admin',
      hash,
      '墨迹'
    )
    userId = Number(info.lastInsertRowid)
    console.log('✓ 创建默认管理员账号: admin / moji123456')
  } else {
    userId = sql.get<{ id: number }>(`SELECT id FROM users LIMIT 1`)!.id
    console.log('· 已存在用户，跳过创建')
  }

  // 2. 读取文章数据
  const candidates = [
    path.resolve(__dirname, 'seed-posts.json'),
    path.resolve(__dirname, '../../../scripts/seed-posts.json'),
  ]
  const seedFile = candidates.find((p) => fs.existsSync(p))
  if (!seedFile) {
    console.error('✗ 找不到 seed-posts.json')
    process.exit(1)
  }
  const posts = JSON.parse(fs.readFileSync(seedFile, 'utf-8')) as SeedPost[]
  console.log(`· 读取到 ${posts.length} 篇文章`)

  // 3. 导入
  let ok = 0
  for (const p of posts) {
    const status = p.status === 'draft' ? 'draft' : 'published'
    const exists = sql.get(`SELECT id FROM posts WHERE slug = ?`, p.slug)
    if (exists) continue

    const info = sql.run(
      `INSERT INTO posts
        (user_id, title, slug, summary, content, cover_url, status, views, read_minutes,
         author_name, created_at, updated_at, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      userId,
      p.title,
      p.slug,
      p.summary ?? null,
      p.content ?? null,
      p.cover_url ?? null,
      status,
      p.views ?? 0,
      p.read_minutes ?? 1,
      p.author_name ?? '墨迹',
      p.created_at ?? new Date().toISOString(),
      p.updated_at ?? new Date().toISOString(),
      status === 'published' ? (p.published_at ?? new Date().toISOString()) : null
    )
    const postId = Number(info.lastInsertRowid)

    for (const name of p.tags ?? []) {
      let row = sql.get<{ id: number }>(`SELECT id FROM tags WHERE name = ?`, name)
      if (!row) {
        sql.run(`INSERT INTO tags (name, slug, color) VALUES (?, ?, 'amber')`, name, slugifyTag(name))
        row = sql.get<{ id: number }>(`SELECT id FROM tags WHERE name = ?`, name)
      }
      if (row) sql.run(`INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)`, postId, row.id)
    }
    ok++
  }

  const published = sql.get<{ c: number }>(`SELECT COUNT(*) AS c FROM posts WHERE status='published'`)?.c ?? 0
  const drafts = sql.get<{ c: number }>(`SELECT COUNT(*) AS c FROM posts WHERE status='draft'`)?.c ?? 0
  const tagCount = sql.get<{ c: number }>(`SELECT COUNT(*) AS c FROM tags`)?.c ?? 0

  console.log(`✓ 导入 ${ok} 篇文章`)
  console.log(`  已发布 ${published} 篇 / 草稿 ${drafts} 篇 / 标签 ${tagCount} 个`)
}

main()
