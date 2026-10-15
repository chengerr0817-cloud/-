import { Link } from 'react-router-dom'
import { Clock, Eye } from 'lucide-react'
import type { Tag } from '@/types/blog'
import { cn } from '@/lib/utils'

interface TagPillProps {
  tag: Pick<Tag, 'name' | 'slug' | 'color'>
  size?: 'sm' | 'md'
  asLink?: boolean
  className?: string
}

/** A small amber-tinted tag chip. Renders as a link to the tag page by default. */
export function TagPill({ tag, size = 'sm', asLink = true, className }: TagPillProps) {
  const cls = cn(
    'inline-flex items-center rounded-full border border-primary/25 bg-primary/10 text-primary font-medium transition-colors hover:bg-primary/18',
    size === 'sm' ? 'text-xs' : 'text-sm',
    className
  )
  const style = {
    padding: size === 'sm' ? '0.15rem 0.6rem' : '0.28rem 0.85rem',
  }

  if (!asLink) {
    return (
      <span className={cls} style={style}>
        {tag.name}
      </span>
    )
  }

  return (
    <Link to={`/tags/${encodeURIComponent(tag.slug)}`} className={cls} style={style}>
      {tag.name}
    </Link>
  )
}

interface PostMetaProps {
  date: string
  readMinutes?: number
  views?: number
  className?: string
}

/** Inline post metadata: date · read time · views. */
export function PostMeta({ date, readMinutes, views, className }: PostMetaProps) {
  return (
    <div
      className={cn('flex flex-wrap items-center text-xs text-muted-foreground', className)}
      style={{ gap: 'var(--spacing-sm)' }}
    >
      <time>{date}</time>
      {readMinutes != null && (
        <span className="inline-flex items-center" style={{ gap: '0.25rem' }}>
          <Clock size={12} /> {readMinutes} 分钟
        </span>
      )}
      {views != null && (
        <span className="inline-flex items-center" style={{ gap: '0.25rem' }}>
          <Eye size={12} /> {views}
        </span>
      )}
    </div>
  )
}
