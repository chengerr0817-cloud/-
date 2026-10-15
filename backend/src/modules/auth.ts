import { Router, type Request, type Response, type Router as ExpressRouter } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { sql } from '../config/database.js'
import { signToken, requireAuth, type AuthUser } from '../middleware/auth.js'

export const authRouter: ExpressRouter = Router()

interface UserRow {
  id: number
  username: string
  password_hash: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

const credsSchema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(6).max(128),
  display_name: z.string().max(64).optional(),
})

function toAuthUser(u: UserRow): AuthUser {
  return { id: u.id, username: u.username, display_name: u.display_name }
}

/** POST /api/auth/register — 注册 */
authRouter.post('/register', (req: Request, res: Response) => {
  const parsed = credsSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ status: 'error', message: '用户名至少 3 位，密码至少 6 位' })
    return
  }
  const { username, password, display_name } = parsed.data

  if (sql.get(`SELECT id FROM users WHERE username = ?`, username)) {
    res.status(409).json({ status: 'error', message: '该用户名已被注册' })
    return
  }

  const hash = bcrypt.hashSync(password, 10)
  const info = sql.run(
    `INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)`,
    username,
    hash,
    display_name ?? username
  )

  const user: AuthUser = {
    id: Number(info.lastInsertRowid),
    username,
    display_name: display_name ?? username,
  }
  res.status(201).json({ status: 'success', token: signToken(user), user })
})

/** POST /api/auth/login — 登录 */
authRouter.post('/login', (req: Request, res: Response) => {
  const parsed = credsSchema.pick({ username: true, password: true }).safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ status: 'error', message: '用户名或密码格式不正确' })
    return
  }
  const { username, password } = parsed.data

  const row = sql.get<UserRow>(`SELECT * FROM users WHERE username = ?`, username)
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    res.status(401).json({ status: 'error', message: '用户名或密码错误' })
    return
  }

  const user = toAuthUser(row)
  res.json({ status: 'success', token: signToken(user), user })
})

/** GET /api/auth/me — 当前登录用户 */
authRouter.get('/me', requireAuth, (req: Request, res: Response) => {
  const row = sql.get<Omit<UserRow, 'password_hash'>>(
    `SELECT id, username, display_name, avatar_url, created_at FROM users WHERE id = ?`,
    req.user!.id
  )
  if (!row) {
    res.status(404).json({ status: 'error', message: '用户不存在' })
    return
  }
  res.json({ status: 'success', user: row })
})

/** GET /api/auth/status — 是否已存在用户（前端据此引导注册） */
authRouter.get('/status', (_req: Request, res: Response) => {
  const c = sql.get<{ c: number }>(`SELECT COUNT(*) AS c FROM users`)?.c ?? 0
  res.json({ hasUsers: c > 0 })
})
