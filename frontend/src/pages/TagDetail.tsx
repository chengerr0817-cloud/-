import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Hash } from 'lucide-react'
import { usePostsByTag, useTags } from '@/hooks/usePosts'
import { PostCard } from '@/components/blog/PostCard'
import { FadeIn, Stagger, HoverLift } from '@/components/MotionPrimitives'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function TagDetail() {
  const { tagName } = useParams<{ tagName: string }>()
  const decoded = tagName ? decodeURIComponent(tagName) : ''
  const { data, isLoading } = usePostsByTag(decoded)
  const { data: allTags } = useTags()

  const current = (allTags || []).find((t) => t.slug === decoded)
  const posts = data?.items || []

  return (
    <div className="container" style={{ padding: 'var(--spacing-3xl) 1rem', maxWidth: '64rem' }}>
      <FadeIn>
        <Link
          to="/tags"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          style={{ gap: '0.3rem', marginBottom: 'var(--spacing-lg)' }}
        >
          <ArrowLeft size={15} /> 全部标签
        </Link>
        <div className="flex items-center flex-wrap" style={{ gap: 'var(--spacing-sm)' }}>
          <span
            className="flex items-center justify-center rounded-xl bg-primary/12 text-primary"
            style={{ width: '2.75rem', height: '2.75rem' }}
          >
            <Hash size={22} />
          </span>
          <h1 className="font-serif font-bold" style={{ fontSize: 'var(--font-size-headline)' }}>
            {current?.name || decoded}
          </h1>
        </div>
        <p className="text-muted-foreground" style={{ marginTop: 'var(--spacing-sm)', marginBottom: 'var(--spacing-2xl)' }}>
          该标签下共有 {data?.total ?? 0} 篇文章
        </p>
      </FadeIn>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border text-center"
          style={{ padding: 'var(--spacing-3xl)', gap: 'var(--spacing-md)' }}
        >
          <p className="text-muted-foreground">该标签下暂无文章</p>
          <Button variant="outline" asChild>
            <Link to="/">返回首页</Link>
          </Button>
        </div>
      ) : (
        <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <HoverLift key={p.id}>
              <PostCard post={p} />
            </HoverLift>
          ))}
        </Stagger>
      )}
    </div>
  )
}
