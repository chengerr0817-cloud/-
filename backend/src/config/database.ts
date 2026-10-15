import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * SQLite 数据库单例（使用 Node.js 内置的 node:sqlite，无需原生依赖）。
 *
 * 数据文件默认位于 backend/data/blog.db，可用 DB_PATH 环境变量覆盖。
 */
const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.resolve(__dirname, '../../data/blog.db')

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

export const db = new DatabaseSync(DB_PATH)

// WAL 提升并发读性能；外键约束开启
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

/* ------------------------------------------------------------------ *
 * 为方便使用，包一层与 better-sqlite3 风格接近的 API：
 *   query(sql).all(...)  /  .get(...)  /  .run(...)
 * node:sqlite 的 StatementSync 原生已支持 all() / get() / run()，
 * 这里统一返回普通对象，规避 null 原型带来的类型困扰。
 * ------------------------------------------------------------------ */

function normalize<T>(row: unknown): T {
  return (row === undefined || row === null ? row : { ...(row as object) }) as T
}

export const sql = {
  all<T = unknown>(query: string, ...params: unknown[]): T[] {
    return (db.prepare(query).all(...(params as never[])) as unknown[]).map((r) => normalize<T>(r))
  },
  get<T = unknown>(query: string, ...params: unknown[]): T | undefined {
    return normalize<T>(db.prepare(query).get(...(params as never[])))
  },
  run(query: string, ...params: unknown[]) {
    return db.prepare(query).run(...(params as never[]))
  },
  exec(query: string) {
    db.exec(query)
  },
  /** 事务包装 */
  transaction<T extends (...args: never[]) => unknown>(fn: T): T {
    return ((...args: never[]) => {
      db.exec('BEGIN')
      try {
        const r = fn(...args)
        db.exec('COMMIT')
        return r
      } catch (e) {
        db.exec('ROLLBACK')
        throw e
      }
    }) as T
  },
}

/** 建表（幂等）。 */
export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name  TEXT,
      avatar_url    TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS posts (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
      title         TEXT NOT NULL,
      slug          TEXT NOT NULL UNIQUE,
      summary       TEXT,
      content       TEXT,
      cover_url     TEXT,
      status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
      views         INTEGER NOT NULL DEFAULT 0,
      read_minutes  INTEGER NOT NULL DEFAULT 1,
      author_name   TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
      published_at  TEXT
    );

    CREATE TABLE IF NOT EXISTS tags (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      name  TEXT NOT NULL UNIQUE,
      slug  TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT 'amber'
    );

    CREATE TABLE IF NOT EXISTS post_tags (
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      tag_id  INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (post_id, tag_id)
    );

    CREATE INDEX IF NOT EXISTS idx_posts_status       ON posts(status);
    CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_posts_user         ON posts(user_id);
    CREATE INDEX IF NOT EXISTS idx_post_tags_post     ON post_tags(post_id);
    CREATE INDEX IF NOT EXISTS idx_post_tags_tag      ON post_tags(tag_id);
  `)
}

export default db
