import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'moji-blog-dev-secret-change-in-production'
const TOKEN_TTL = '30d'

export interface AuthUser {
  id: number
  username: string
  display_name: string | null
}

// 扩展 Express Request 类型
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

/** 签发 JWT。 */
export function signToken(user: AuthUser): string {
  return jwt.sign(
    { sub: String(user.id), username: user.username, display_name: user.display_name },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  )
}

function readToken(req: Request): string | null {
  const h = req.headers.authorization
  if (!h) return null
  const m = /^Bearer\s+(.+)$/i.exec(h)
  return m ? m[1] : null
}

/** 从请求中解析并校验 token，返回用户或 null。 */
function resolveUser(req: Request): AuthUser | null {
  const token = readToken(req)
  if (!token) return null
  try {
    const p = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload
    return {
      id: Number(p.sub),
      username: String(p.username ?? ''),
      display_name: (p.display_name as string | null) ?? null,
    }
  } catch {
    return null
  }
}

/** 解析 token（若有），不强制要求登录。 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const u = resolveUser(req)
  if (u) req.user = u
  next()
}

/** 强制要求登录。自身即可解析 token，无需依赖 optionalAuth 先执行。 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    const u = resolveUser(req)
    if (u) req.user = u
  }
  if (!req.user) {
    res.status(401).json({ status: 'error', message: '未登录或登录已过期' })
    return
  }
  next()
}
