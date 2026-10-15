import { useCallback, useEffect, useState } from 'react'
import apiClient, { getErrorMessage } from '@/lib/api-client'

/* ------------------------------------------------------------------ *
 * 类型（与后端 blog-repo.ts 保持一致）
 * ------------------------------------------------------------------ */

export interface Tag {
  id: number
  name: string
  slug: string
  color: string
  post_count?: number
}

export interface Post {
  id: number
  user_id?: number | null
  title: string
  slug: string
  summary: string | null
  /** 详情与我的文章接口返回全文；列表场景可能为 null */
  content: string | null
  cover_url: string | null
  status: 'draft' | 'published'
  views: number
  read_minutes: number
  author_name: string | null
  created_at: string
  updated_at: string
  published_at: string | null
  tags: Tag[]
}

/** 列表页只需要部分字段（热门/相关文章）。 */
export type PostSummary = Pick<
  Post,
  'id' | 'title' | 'slug' | 'summary' | 'cover_url' | 'read_minutes' | 'published_at'
> & {
  views?: number
  tags?: Tag[]
}

export interface SiteStats {
  post_count: number
  draft_count: number
  total_views: number
  tag_count: number
  total_words: number
}

export interface PostPayload {
  title: string
  slug: string
  summary?: string | null
  content?: string | null
  cover_url?: string | null
  status: 'draft' | 'published'
  read_minutes?: number
  author_name?: string | null
  tags?: string[]
}

interface ListResult {
  items: Post[]
  total: number
}

interface QueryState<T> {
  data: T | undefined
  isLoading: boolean
  error: string | null
  refetch: () => void
}

/** 通用 GET hook：统一 loading / error / refetch 语义。 */
function useApiQuery<T>(url: string | null, deps: unknown[] = []): QueryState<T> {
  const [data, setData] = useState<T | undefined>(undefined)
  const [loadingUrl, setLoadingUrl] = useState<string | null>(url)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!url) return
    let alive = true
    const run = async () => {
      try {
        const { data: payload } = await apiClient.get<T>(url)
        if (!alive) return
        setData(payload)
        setError(null)
      } catch (err) {
        if (!alive) return
        setError(getErrorMessage(err))
      } finally {
        if (alive) setLoadingUrl(null)
      }
    }
    void run()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, tick, ...deps])

  const refetch = useCallback(() => setTick((t) => t + 1), [])
  return {
    data: url ? data : undefined,
    isLoading: !!url && loadingUrl !== null,
    error,
    refetch,
  }
}

/* ------------------------------------------------------------------ *
 * 公开读取
 * ------------------------------------------------------------------ */

/** 首页文章分页列表。 */
export function usePosts(page = 1, limit = 10) {
  return useApiQuery<ListResult>(`/blog/posts?page=${page}&limit=${limit}`)
}

/** 文章详情 + 标签 + 相关文章。 */
export function usePostDetail(slug: string | undefined) {
  return useApiQuery<{
    found: true
    post: Post
    tags: Tag[]
    related: PostSummary[]
  }>(slug ? `/blog/posts/${encodeURIComponent(slug)}` : null)
}

/** 全部标签（含文章数）。 */
export function useTags() {
  return useApiQuery<Tag[]>('/blog/tags')
}

/** 站点统计数据。 */
export function useSiteStats() {
  return useApiQuery<SiteStats>('/blog/stats')
}

/** 热门文章。 */
export function useHotPosts(limit = 5) {
  return useApiQuery<{ posts: PostSummary[] }>(`/blog/posts/hot?limit=${limit}`)
}

/** 按标签筛选：复用列表接口后在本地过滤，避免额外后端接口。 */
export function usePostsByTag(tagSlug: string | undefined, limit = 100) {
  const state = useApiQuery<ListResult>(`/blog/posts?limit=${limit}`)
  const filtered = state.data
    ? {
        items: state.data.items.filter((p) => p.tags?.some((t) => t.slug === tagSlug)),
        total: 0,
      }
    : undefined
  return { ...state, data: filtered }
}

/** 关键词搜索：拉取列表后在本地匹配标题、摘要与正文。 */
export function useSearchPosts(keyword: string, limit = 100) {
  const state = useApiQuery<ListResult>(`/blog/posts?limit=${limit}`)
  const q = keyword.trim().toLowerCase()
  const filtered =
    state.data && q
      ? {
          items: state.data.items.filter((p) => {
            const hay = `${p.title} ${p.summary ?? ''}`.toLowerCase()
            return hay.includes(q)
          }),
          total: 0,
        }
      : state.data

  return {
    ...state,
    data: q ? filtered : { items: [], total: 0 },
  }
}

/* ------------------------------------------------------------------ *
 * 写作台
 * ------------------------------------------------------------------ */

/** 我的全部文章（含草稿）。 */
export function useMyPosts(enabled = true) {
  const state = useApiQuery<{ items: Post[] }>(enabled ? '/blog/my/posts' : null)
  return { ...state, data: state.data?.items }
}

/** 编辑文章时读取其标签名列表。 */
export async function fetchPostTagNames(postId: number): Promise<string[]> {
  const { data } = await apiClient.get<{ tags: string[] }>(`/blog/my/posts/${postId}/tags`)
  return data.tags ?? []
}

export async function createPost(payload: PostPayload): Promise<number> {
  const { data } = await apiClient.post<{ id: number }>('/blog/posts', payload)
  return data.id
}

export async function updatePost(id: number, payload: Partial<PostPayload>): Promise<void> {
  await apiClient.put(`/blog/posts/${id}`, payload)
}

export async function deletePost(id: number): Promise<void> {
  await apiClient.delete(`/blog/posts/${id}`)
}

/** 浏览量 +1（失败时静默，不影响阅读）。 */
export async function incrementViews(slug: string): Promise<void> {
  try {
    await apiClient.post(`/blog/views/${encodeURIComponent(slug)}`)
  } catch {
    /* 忽略 */
  }
}

/** 上传图片/附件，返回可访问 URL。 */
export async function uploadFile(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await apiClient.post<{ url: string }>('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.url
}
