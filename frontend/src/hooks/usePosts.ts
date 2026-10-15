import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { db, rpc } from '@/lib/cloudbase'
import type {
  PostListResult,
  PostDetailResult,
  TagWithCount,
  SiteStats,
  PostWithTags,
  Tag,
} from '@/types/blog'

/* ------------------------------------------------------------------ *
 * Queries
 * ------------------------------------------------------------------ */

/** Paginated list of published posts (plus the author's own drafts). */
export function usePosts(page = 1, pageSize = 8, includeDrafts = false) {
  const offset = (page - 1) * pageSize
  return useQuery({
    queryKey: ['posts', page, pageSize, includeDrafts],
    queryFn: () =>
      rpc<PostListResult>('list_posts', {
        p_limit: pageSize,
        p_offset: offset,
        p_include_drafts: includeDrafts,
      }),
  })
}

/** Single post detail by slug, with tags and related posts. */
export function usePostDetail(slug: string | undefined) {
  return useQuery({
    queryKey: ['post', slug],
    enabled: !!slug,
    queryFn: () => rpc<PostDetailResult>('get_post_detail', { p_slug: slug }),
  })
}

/** All tags with a published post count. */
export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => rpc<TagWithCount[]>('list_tags'),
  })
}

/** Aggregate site statistics. */
export function useSiteStats() {
  return useQuery({
    queryKey: ['site-stats'],
    queryFn: () => rpc<SiteStats>('site_stats'),
  })
}

/** Posts belonging to a single tag (client-side filter over the full list). */
export function usePostsByTag(tagSlug: string | undefined) {
  return useQuery({
    queryKey: ['posts-by-tag', tagSlug],
    enabled: !!tagSlug,
    queryFn: async () => {
      // Pull a generous window then filter by tag on the client.
      const res = await rpc<PostListResult>('list_posts', {
        p_limit: 100,
        p_offset: 0,
        p_include_drafts: false,
      })
      const items = (res.items || []).filter((p) =>
        (p.tags || []).some((t) => t.slug === tagSlug)
      )
      return { items, total: items.length }
    },
  })
}

/** Client-side keyword search across title, summary and content. */
export function useSearchPosts(keyword: string) {
  const q = keyword.trim().toLowerCase()
  return useQuery({
    queryKey: ['search', q],
    enabled: q.length > 0,
    queryFn: async () => {
      const res = await rpc<PostListResult>('list_posts', {
        p_limit: 200,
        p_offset: 0,
        p_include_drafts: false,
      })
      const items = (res.items || []).filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.summary || '').toLowerCase().includes(q) ||
          (p.content || '').toLowerCase().includes(q)
      )
      return { items, total: items.length }
    },
  })
}

/** The current user's own posts, including drafts. */
export function useMyPosts(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-posts', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await db
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
      if (error) throw new Error(error.message)
      return (data || []) as PostWithTags[]
    },
  })
}

/* ------------------------------------------------------------------ *
 * Mutations
 * ------------------------------------------------------------------ */

export interface PostPayload {
  title: string
  slug: string
  summary: string
  content: string
  cover_url: string | null
  status: 'draft' | 'published'
  read_minutes: number
  author_name: string
}

/** Create a post, then sync its tag associations. */
export function useCreatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { post: PostPayload; tags: string[] }) => {
      // TCB PG REST does not support .select() after insert — insert then re-read by slug.
      const { error } = await db.from('posts').insert({
        title: input.post.title,
        slug: input.post.slug,
        summary: input.post.summary,
        content: input.post.content,
        cover_url: input.post.cover_url,
        status: input.post.status,
        read_minutes: input.post.read_minutes,
        author_name: input.post.author_name,
        published_at: input.post.status === 'published' ? new Date().toISOString() : null,
      })
      if (error) throw new Error(error.message)

      const { data: created, error: readErr } = await db
        .from('posts')
        .select('id')
        .eq('slug', input.post.slug)
        .single()
      if (readErr) throw new Error(readErr.message)

      const postId = (created as { id: number }).id
      await syncTags(postId, input.tags)
      return postId
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] })
      qc.invalidateQueries({ queryKey: ['post'] })
      qc.invalidateQueries({ queryKey: ['tags'] })
      qc.invalidateQueries({ queryKey: ['my-posts'] })
      qc.invalidateQueries({ queryKey: ['site-stats'] })
    },
  })
}

/** Update an existing post and re-sync its tags. */
export function useUpdatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: number; post: Partial<PostPayload>; tags: string[] }) => {
      const patch: Record<string, unknown> = { ...input.post, updated_at: new Date().toISOString() }
      if (input.post.status === 'published') {
        patch.published_at = new Date().toISOString()
      }
      const { error } = await db.from('posts').update(patch).eq('id', input.id)
      if (error) throw new Error(error.message)
      await syncTags(input.id, input.tags)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] })
      qc.invalidateQueries({ queryKey: ['post'] })
      qc.invalidateQueries({ queryKey: ['tags'] })
      qc.invalidateQueries({ queryKey: ['my-posts'] })
      qc.invalidateQueries({ queryKey: ['site-stats'] })
    },
  })
}

/** Delete a post (cascades to post_tags / comments). */
export function useDeletePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await db.from('posts').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] })
      qc.invalidateQueries({ queryKey: ['my-posts'] })
      qc.invalidateQueries({ queryKey: ['tags'] })
      qc.invalidateQueries({ queryKey: ['site-stats'] })
    },
  })
}

/** Increment a post's view counter (fire-and-forget). */
export function incrementViews(slug: string) {
  return rpc('inc_post_views', { p_slug: slug }).catch(() => undefined)
}

/* ------------------------------------------------------------------ *
 * Tag helpers
 * ------------------------------------------------------------------ */

/** Ensure tags exist (creating missing ones), then rebuild post_tags links. */
export async function syncTags(postId: number, tagNames: string[]): Promise<void> {
  // Clear existing links first.
  const { error: delErr } = await db.from('post_tags').delete().eq('post_id', postId)
  if (delErr) throw new Error(delErr.message)

  const clean = Array.from(
    new Set(tagNames.map((t) => t.trim()).filter(Boolean))
  )
  if (clean.length === 0) return

  const tagIds: number[] = []
  for (const name of clean) {
    const slug = name.toLowerCase().replace(/\s+/g, '-')
    const { data: existing } = await db.from('tags').select('id').eq('name', name).maybeSingle()
    if (existing) {
      tagIds.push((existing as { id: number }).id)
    } else {
      const { error: insErr } = await db.from('tags').insert({ name, slug, color: 'amber' })
      if (insErr) continue
      const { data: created } = await db.from('tags').select('id').eq('name', name).maybeSingle()
      if (created) tagIds.push((created as { id: number }).id)
    }
  }

  if (tagIds.length === 0) return
  const links = tagIds.map((tag_id) => ({ post_id: postId, tag_id }))
  const { error: linkErr } = await db.from('post_tags').insert(links)
  if (linkErr) throw new Error(linkErr.message)
}

/** Load tags for editing (name list). */
export async function fetchPostTagNames(postId: number): Promise<string[]> {
  const { data, error } = await db
    .from('post_tags')
    .select('tag:tags(name)')
    .eq('post_id', postId)
  if (error) return []
  const rows = (data || []) as { tag?: Tag | Tag[] }[]
  return rows
    .map((row) => {
      const t = Array.isArray(row.tag) ? row.tag[0] : row.tag
      return t?.name
    })
    .filter((n): n is string => !!n)
}
