import { Link } from 'react-router-dom'
import { Hash, Tag as TagIcon } from 'lucide-react'
import { useTags, type Tag } from '@/hooks/usePosts'
import { FadeIn, Stagger, HoverLift } from '@/components/MotionPrimitives'
import { Skeleton } from '@/components/ui/skeleton'

export default function Tags() {
  const { data: tags, isLoading } = useTags()
  const list = (tags || []).filter(
    (t): t is Tag & { post_count: number } =>
      typeof t.post_count === 'number' && t.post_count > 0
  )
  const maxCount = Math.max(1, ...list.map((t) => t.post_count))

  return (
    <div className="container" style={{ padding: 'var(--spacing-3xl) 1rem', maxWidth: '64rem' }}>
      <FadeIn>
        <div className="flex items-center" style={{ gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
          <TagIcon size={26} className="text-primary" />
          <h1 className="font-serif font-bold" style={{ fontSize: 'var(--font-size-headline)' }}>
            标签分类
          </h1>
        </div>
        <p className="text-muted-foreground" style={{ maxWidth: '36rem', marginBottom: 'var(--spacing-2xl)' }}>
          按主题浏览全部文章，标签字号越大代表该主题下的文章越多。
        </p>
      </FadeIn>

      {isLoading ? (
        <div className="flex flex-wrap" style={{ gap: 'var(--spacing-md)' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-28 rounded-full" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border text-center"
          style={{ padding: 'var(--spacing-3xl)' }}
        >
          <Hash size={32} className="text-muted-foreground" />
          <p className="text-muted-foreground" style={{ marginTop: 'var(--spacing-md)' }}>
            还没有任何标签
          </p>
        </div>
      ) : (
        <Stagger className="flex flex-wrap" style={{ gap: 'var(--spacing-md)' }}>
          {list.map((t) => {
            const scale = 0.95 + (t.post_count / maxCount) * 0.6
            return (
              <HoverLift key={t.id}>
                <Link
                  to={`/tags/${encodeURIComponent(t.slug)}`}
                  className="inline-flex items-center rounded-full border border-primary/25 bg-primary/8 text-primary font-medium transition-colors hover:bg-primary/18 hover:border-primary/45"
                  style={{
                    gap: '0.45rem',
                    padding: '0.55rem 1.15rem',
                    fontSize: `${scale}rem`,
                  }}
                >
                  <span className="opacity-60">#</span>
                  {t.name}
                  <span
                    className="rounded-full bg-primary/15 font-normal"
                    style={{ padding: '0 0.5rem', fontSize: '0.78rem' }}
                  >
                    {t.post_count}
                  </span>
                </Link>
              </HoverLift>
            )
          })}
        </Stagger>
      )}
    </div>
  )
}
