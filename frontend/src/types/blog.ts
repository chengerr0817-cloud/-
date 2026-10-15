/** Tag attached to a post (from the post_tags join). */
export interface Tag {
  id: number
  name: string
  slug: string
  color: string
}

/** Tag with a published post count (from list_tags RPC). */
export interface TagWithCount extends Tag {
  post_count: number
}

/** A blog post row as returned by the database. */
export interface Post {
  id: number
  user_id?: string
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

/** Post with its tags resolved (list view). */
export interface PostWithTags extends Post {
  tags: Tag[]
}

/** Related post card (from get_post_detail RPC). */
export interface RelatedPost {
  id: number
  title: string
  slug: string
  summary: string | null
  cover_url: string | null
  published_at: string | null
  read_minutes: number
}

/** Payload returned by the get_post_detail RPC. */
export interface PostDetailResult {
  found: boolean
  post?: Post
  tags?: Tag[]
  related?: RelatedPost[]
}

/** Payload returned by the list_posts RPC. */
export interface PostListResult {
  items: PostWithTags[]
  total: number
}

/** Payload returned by the site_stats RPC. */
export interface SiteStats {
  post_count: number
  draft_count: number
  tag_count: number
  total_views: number
  total_words: number
}
