import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, Eye, PenLine } from 'lucide-react'
import { usePostDetail, incrementViews } from '@/hooks/usePosts'
import { MarkdownRenderer } from '@/components/blog/MarkdownRenderer'
import { TagPill } from '@/components/blog/TagPill'
import { ReadingProgress, BackToTop } from '@/components/blog/ReadingProgress'
import { FadeIn, Stagger, HoverLift } from '@/components/MotionPrimitives'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/AuthContext'
import { formatDate } from '@/lib/blog-utils'

export default function PostDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data, isLoading, error } = usePostDetail(slug)

  // Bump the view counter once per slug visit.
  useEffect(() => {
    if (slug && data?.found) {
      incrementViews(slug)
    }
  }, [slug, data?.found])

  const post = data?.post
  const tags = useMemo(() => data?.tags ?? [], [data?.tags])
  const related = data?.related || []
  const isAuthor = !!user && !!post && post.user_id != null && user.id === post.user_id

  // Rough reading progress via document height is handled by ReadingProgress.

  const jsonLd = useMemo(() => {
    if (!post) return null
    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.summary || undefined,
      image: post.cover_url || undefined,
      datePublished: post.published_at || post.created_at,
      dateModified: post.updated_at,
      author: { '@type': 'Person', name: post.author_name || '墨迹' },
      keywords: tags.map((t) => t.name).join(', '),
    }
  }, [post, tags])

  if (isLoading) {
    return (
      <div className="container" style={{ padding: 'var(--spacing-2xl) 1rem', maxWidth: '56rem' }}>
        <Skeleton className="h-10 w-3/4 rounded-lg" />
        <Skeleton className="mt-4 h-5 w-40 rounded" />
        <Skeleton className="mt-8 h-96 w-full rounded-xl" />
      </div>
    )
  }

  if (error || !data?.found || !post) {
    return (
      <div
        className="container flex flex-col items-center justify-center text-center"
        style={{ padding: 'var(--spacing-3xl) 1rem', gap: 'var(--spacing-md)', minHeight: '50vh' }}
      >
        <h1 className="font-serif font-semibold" style={{ fontSize: '1.8rem' }}>
          文章不存在
        </h1>
        <p className="text-muted-foreground">这篇文字可能已被删除，或链接有误。</p>
        <Button onClick={() => navigate('/')} style={{ gap: 'var(--spacing-xs)' }}>
          <ArrowLeft size={16} /> 返回首页
        </Button>
      </div>
    )
  }

  return (
    <div>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <ReadingProgress />

      {/* Cover hero */}
      <div className="border-b border-border" style={{ backgroundColor: 'var(--muted)' }}>
        <div className="container" style={{ padding: 'var(--spacing-2xl) 1rem 0', maxWidth: '56rem' }}>
          <FadeIn>
            <Link
              to="/"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
              style={{ gap: '0.3rem', marginBottom: 'var(--spacing-lg)' }}
            >
              <ArrowLeft size={15} /> 返回文章列表
            </Link>

            {post.status === 'draft' && (
              <span
                className="inline-flex rounded-full bg-warning text-warning-foreground text-xs font-medium"
                style={{ padding: '0.25rem 0.7rem', marginBottom: 'var(--spacing-sm)' }}
              >
                草稿 · 仅你可见
              </span>
            )}

            <h1
              className="font-serif font-bold leading-tight tracking-tight"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 2.75rem)' }}
            >
              {post.title}
            </h1>

            {post.summary && (
              <p
                className="text-muted-foreground"
                style={{ marginTop: 'var(--spacing-md)', fontSize: '1.05rem', lineHeight: 1.75 }}
              >
                {post.summary}
              </p>
            )}

            <div
              className="flex flex-wrap items-center text-sm text-muted-foreground"
              style={{ gap: 'var(--spacing-lg)', marginTop: 'var(--spacing-lg)' }}
            >
              <span className="inline-flex items-center font-medium text-foreground" style={{ gap: '0.35rem' }}>
                <span
                  className="flex items-center justify-center rounded-full bg-primary/12 text-primary font-serif font-semibold"
                  style={{ width: '1.6rem', height: '1.6rem', fontSize: '0.8rem' }}
                >
                  {(post.author_name || '墨')[0]}
                </span>
                {post.author_name || '墨迹'}
              </span>
              <span className="inline-flex items-center" style={{ gap: '0.35rem' }}>
                <Calendar size={14} /> {formatDate(post.published_at || post.created_at)}
              </span>
              <span className="inline-flex items-center" style={{ gap: '0.35rem' }}>
                <Clock size={14} /> {post.read_minutes} 分钟阅读
              </span>
              <span className="inline-flex items-center" style={{ gap: '0.35rem' }}>
                <Eye size={14} /> {post.views} 次阅读
              </span>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap" style={{ gap: '0.45rem', marginTop: 'var(--spacing-lg)' }}>
                {tags.map((t) => (
                  <TagPill key={t.id} tag={t} size="md" />
                ))}
              </div>
            )}
          </FadeIn>
        </div>

        {post.cover_url && (
          <div className="container" style={{ padding: 'var(--spacing-xl) 1rem 0', maxWidth: '56rem' }}>
            <FadeIn>
              <img
                src={post.cover_url}
                alt={post.title}
                className="w-full rounded-xl object-cover shadow-md"
                style={{ maxHeight: '24rem' }}
              />
            </FadeIn>
          </div>
        )}
      </div>

      {/* Article body */}
      <article className="container" style={{ padding: 'var(--spacing-2xl) 1rem', maxWidth: '56rem' }}>
        <FadeIn>
          <MarkdownRenderer content={post.content || ''} />
        </FadeIn>

        {isAuthor && (
          <div
            className="flex items-center justify-between rounded-xl border border-border bg-muted"
            style={{ padding: 'var(--spacing-md) var(--spacing-lg)', marginTop: 'var(--spacing-2xl)' }}
          >
            <span className="text-sm text-muted-foreground">这是你的文章</span>
            <Button size="sm" variant="outline" style={{ gap: 'var(--spacing-xs)' }} onClick={() => navigate(`/edit/${post.id}`)}>
              <PenLine size={15} /> 编辑
            </Button>
          </div>
        )}
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-border" style={{ backgroundColor: 'var(--muted)' }}>
          <div className="container" style={{ padding: 'var(--spacing-2xl) 1rem', maxWidth: '56rem' }}>
            <h2 className="font-serif font-semibold" style={{ fontSize: '1.4rem', marginBottom: 'var(--spacing-lg)' }}>
              相关文章
            </h2>
            <Stagger className="grid gap-5 sm:grid-cols-3">
              {related.map((r) => (
                <HoverLift key={r.id}>
                  <Link
                    to={`/posts/${encodeURIComponent(r.slug)}`}
                    className="flex h-full flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="overflow-hidden bg-muted" style={{ aspectRatio: '16 / 9' }}>
                      {r.cover_url ? (
                        <img src={r.cover_url} alt={r.title} loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, oklch(0.93 0.055 85), oklch(0.88 0.09 72))' }}
                        >
                          <span className="font-serif text-primary/45" style={{ fontSize: '1.8rem' }}>墨</span>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: 'var(--spacing-md)' }}>
                      <h3 className="font-serif font-medium text-sm line-clamp-2" style={{ lineHeight: 1.5 }}>
                        {r.title}
                      </h3>
                      <div className="text-xs text-muted-foreground" style={{ marginTop: 'var(--spacing-sm)' }}>
                        {formatDate(r.published_at)} · {r.read_minutes} 分钟
                      </div>
                    </div>
                  </Link>
                </HoverLift>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      <BackToTop />
    </div>
  )
}
