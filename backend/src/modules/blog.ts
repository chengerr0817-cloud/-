import { Router, type Request, type Response, type Router as ExpressRouter } from 'express'
import { z } from 'zod'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import * as repo from './blog-repo.js'

export const blogRouter: ExpressRouter = Router()

/* ------------------------------------------------------------------ *
 * 公开读取接口
 * 注意：静态路径（hot）必须放在参数路径（:slug）之前，
 *       否则 /posts/hot 会被 /posts/:slug 抢先匹配。
 * ------------------------------------------------------------------ */

/** GET /api/blog/posts/hot — 热门文章 */
blogRouter.get('/posts/hot', (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 5) || 5, 20)
  res.json({ posts: repo.hotPosts(limit) })
})

/** GET /api/blog/posts — 文章列表（分页） */
blogRouter.get('/posts', optionalAuth, (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 10) || 10, 100)
  const page = Math.max(Number(req.query.page ?? 1) || 1, 1)
  const includeDrafts = req.query.include_drafts === 'true' && !!req.user
  res.json(repo.listPosts(limit, (page - 1) * limit, includeDrafts))
})

/** GET /api/blog/posts/:slug — 文章详情 */
blogRouter.get('/posts/:slug', (req: Request, res: Response) => {
  const result = repo.getPostDetail(String(req.params.slug))
  if (!result.found) {
    res.status(404).json({ status: 'error', message: '文章不存在' })
    return
  }
  res.json(result)
})

/** GET /api/blog/tags — 全部标签 */
blogRouter.get('/tags', (_req: Request, res: Response) => {
  res.json(repo.listTags())
})

/** GET /api/blog/stats — 站点统计 */
blogRouter.get('/stats', (_req: Request, res: Response) => {
  res.json(repo.siteStats())
})

/** POST /api/blog/views/:slug — 浏览量 +1 */
blogRouter.post('/views/:slug', (req: Request, res: Response) => {
  repo.incViews(String(req.params.slug))
  res.json({ ok: true })
})

/* ------------------------------------------------------------------ *
 * 需要登录的写作接口
 * ------------------------------------------------------------------ */

const postSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: z.string().nullish(),
  content: z.string().nullish(),
  cover_url: z.string().nullish(),
  status: z.enum(['draft', 'published']),
  read_minutes: z.number().int().positive().optional(),
  author_name: z.string().nullish(),
  tags: z.array(z.string()).optional().default([]),
})

/** GET /api/blog/my/posts — 我的文章（含草稿） */
blogRouter.get('/my/posts', requireAuth, (req: Request, res: Response) => {
  res.json({ items: repo.listMyPosts(req.user!.id) })
})

/** GET /api/blog/my/posts/:id/tags — 编辑时读取标签 */
blogRouter.get('/my/posts/:id/tags', requireAuth, (req: Request, res: Response) => {
  res.json({ tags: repo.tagNamesOf(Number(req.params.id)) })
})

/** POST /api/blog/posts — 新建文章 */
blogRouter.post('/posts', requireAuth, (req: Request, res: Response) => {
  const parsed = postSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ status: 'error', message: '参数校验失败', issues: parsed.error.issues })
    return
  }
  const { tags, ...post } = parsed.data
  const id = repo.createPost(req.user!.id, post)
  repo.syncTags(id, tags)
  res.status(201).json({ id })
})

/** PUT /api/blog/posts/:id — 更新文章 */
blogRouter.put('/posts/:id', requireAuth, (req: Request, res: Response) => {
  const parsed = postSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ status: 'error', message: '参数校验失败', issues: parsed.error.issues })
    return
  }
  const { tags, ...post } = parsed.data
  const ok = repo.updatePost(Number(req.params.id), req.user!.id, post)
  if (!ok) {
    res.status(404).json({ status: 'error', message: '文章不存在或无权修改' })
    return
  }
  if (tags) repo.syncTags(Number(req.params.id), tags)
  res.json({ ok: true })
})

/** DELETE /api/blog/posts/:id — 删除文章 */
blogRouter.delete('/posts/:id', requireAuth, (req: Request, res: Response) => {
  const ok = repo.deletePost(Number(req.params.id), req.user!.id)
  if (!ok) {
    res.status(404).json({ status: 'error', message: '文章不存在或无权删除' })
    return
  }
  res.json({ ok: true })
})
