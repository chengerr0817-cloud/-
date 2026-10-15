import { Link, useSearchParams } from 'react-router-dom'
import { SearchX, Search as SearchIcon } from 'lucide-react'
import { useSearchPosts } from '@/hooks/usePosts'
import { PostCard } from '@/components/blog/PostCard'
import { FadeIn, Stagger, HoverLift } from '@/components/MotionPrimitives'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function Search() {
  const [params] = useSearchParams()
  const keyword = params.get('q') || ''
  const { data, isLoading } = useSearchPosts(keyword)
  const posts = data?.items || []

  return (
    <div className="container" style={{ padding: 'var(--spacing-3xl) 1rem', maxWidth: '64rem' }}>
      <FadeIn>
        <div className="flex items-center" style={{ gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
          <SearchIcon size={24} className="text-primary" />
          <h1 className="font-serif font-bold" style={{ fontSize: 'var(--font-size-headline)' }}>
            搜索结果
          </h1>
        </div>
        <p className="text-muted-foreground" style={{ marginBottom: 'var(--spacing-2xl)' }}>
          关键词「<span className="text-foreground font-medium">{keyword}</span>」
          {!isLoading && ` · 找到 ${data?.total ?? 0} 篇文章`}
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
          <SearchX size={36} className="text-muted-foreground" />
          <p className="text-muted-foreground">没有找到相关文章，换个关键词试试？</p>
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
