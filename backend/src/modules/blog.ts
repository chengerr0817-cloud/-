import { Router, Request, Response, type Router as ExpressRouter } from 'express'
import { z } from 'zod'
import { optionalAuth, requireAuth, tcbRpc, tcbQuery, tcbInsert } from '../middleware/auth-middleware.js'

export const blogRouter: ExpressRouter = Router()

// ============================================
// Blog Module — aggregate + auth-gated endpoints
// Standard CRUD is done on the frontend via the TCB SDK (app.rdb()) + RLS.
// These endpoints cover server-side aggregation and verified-write flows.
// ============================================

/** POST /api/blog/posts/hot — most-viewed published posts. */
blogRouter.post('/posts/hot', optionalAuth, async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.body?.limit ?? 5) || 5, 20)
  const { data } = await tcbQuery(req, 'posts', {
    select: 'id,title,slug,summary,cover_url,views,read_minutes,published_at',
    filter: { status: 'eq.published' },
    order: 'views.desc',
    limit,
  })
  res.json({ posts: data })
})

/** POST /api/blog/posts/latest — newest published posts. */
blogRouter.post('/posts/latest', optionalAuth, async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.body?.limit ?? 5) || 5, 20)
  const { data } = await tcbQuery(req, 'posts', {
    select: 'id,title,slug,summary,cover_url,views,read_minutes,published_at',
    filter: { status: 'eq.published' },
    order: 'published_at.desc',
    limit,
  })
  res.json({ posts: data })
})

/** GET /api/blog/stats — aggregate site statistics via RPC. */
blogRouter.get('/stats', optionalAuth, async (req: Request, res: Response) => {
  const stats = await tcbRpc(req, 'site_stats')
  res.json({ stats })
})

/** GET /api/blog/tags — tags with published post counts via RPC. */
blogRouter.get('/tags', optionalAuth, async (req: Request, res: Response) => {
  const tags = await tcbRpc(req, 'list_tags')
  res.json({ tags })
})

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  summary: z.string().max(500).optional(),
  status: z.enum(['draft', 'published']).default('draft'),
})

/**
 * POST /api/blog/posts — create a post on behalf of the authenticated user.
 * Demonstrates backend-verified writes (JWT signature checked, RLS enforced).
 */
blogRouter.post('/posts', requireAuth, async (req: Request, res: Response) => {
  const parsed = createPostSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() })
    return
  }
  const { title, content, summary, status } = parsed.data
  const slugBase = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '')
  const slug = `${slugBase}-${Date.now().toString(36).slice(-4)}`

  const rows = await tcbInsert(req, 'posts', {
    user_id: req.user!.id,
    title,
    slug,
    summary: summary ?? '',
    content,
    status,
    author_name: req.user!.name || '墨迹',
    published_at: status === 'published' ? new Date().toISOString() : null,
  })
  res.status(201).json({ post: rows[0] ?? null })
})
