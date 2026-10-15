import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, Eye } from 'lucide-react'
import type { PostWithTags, RelatedPost } from '@/types/blog'
import { formatDate } from '@/lib/blog-utils'
import { TagPill } from './TagPill'

interface PostCardProps {
  /** 完整文章或列表/相关文章的部分字段均可渲染。 */
  post: PostWithTags | RelatedPost
  featured?: boolean
  showStatus?: boolean
}

/** Article card used in the home feed, tag pages and search results. */
export function PostCard({ post, featured = false, showStatus = false }: PostCardProps) {
  const href = `/posts/${encodeURIComponent(post.slug)}`
  const date = formatDate(post.published_at || ('created_at' in post ? post.created_at : null))
  const views = 'views' in post ? post.views : undefined
  const status = 'status' in post ? post.status : undefined
  const postTags = 'tags' in post ? post.tags : []

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="group h-full"
    >
      <Link
        to={href}
        className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
        style={{ textDecoration: 'none' }}
      >
        {/* Cover */}
        <div
          className="relative overflow-hidden bg-muted"
          style={{ aspectRatio: featured ? '16 / 7' : '16 / 9' }}
        >
          {post.cover_url ? (
            <img
              src={post.cover_url}
              alt={post.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                background:
                  'linear-gradient(135deg, oklch(0.93 0.055 85), oklch(0.88 0.09 72))',
              }}
            >
              <span className="font-serif text-primary/45" style={{ fontSize: '2.4rem' }}>
                墨
              </span>
            </div>
          )}
          {showStatus && status === 'draft' && (
            <span
              className="absolute rounded-full bg-warning text-warning-foreground font-medium text-xs"
              style={{ top: '0.75rem', left: '0.75rem', padding: '0.2rem 0.65rem' }}
            >
              草稿
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col" style={{ padding: 'var(--spacing-lg)', gap: 'var(--spacing-sm)' }}>
          <h3
            className="font-serif font-semibold leading-snug text-foreground transition-colors group-hover:text-primary line-clamp-2"
            style={{ fontSize: featured ? '1.5rem' : '1.2rem' }}
          >
            {post.title}
          </h3>

          {post.summary && (
            <p className="text-sm text-muted-foreground line-clamp-2" style={{ lineHeight: 1.7 }}>
              {post.summary}
            </p>
          )}

          <div className="mt-auto flex flex-col" style={{ gap: 'var(--spacing-sm)', paddingTop: 'var(--spacing-sm)' }}>
            {postTags.length > 0 && (
              <div className="flex flex-wrap" style={{ gap: '0.4rem' }}>
                {postTags.slice(0, 3).map((t) => (
                  <TagPill key={t.id} tag={t} asLink={false} />
                ))}
              </div>
            )}
            <div
              className="flex items-center justify-between text-xs text-muted-foreground"
              style={{ paddingTop: 'var(--spacing-xs)', borderTop: '1px solid var(--border)' }}
            >
              <time>{date}</time>
              <div className="flex items-center" style={{ gap: 'var(--spacing-sm)' }}>
                <span className="inline-flex items-center" style={{ gap: '0.25rem' }}>
                  <Clock size={12} /> {post.read_minutes} 分钟
                </span>
                {views !== undefined && (
                  <span className="inline-flex items-center" style={{ gap: '0.25rem' }}>
                    <Eye size={12} /> {views}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
