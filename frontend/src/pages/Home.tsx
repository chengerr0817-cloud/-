import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, PenLine, Sparkles, TrendingUp } from 'lucide-react'
import { usePosts, useTags, useSiteStats } from '@/hooks/usePosts'
import { PostCard } from '@/components/blog/PostCard'
import { TagPill } from '@/components/blog/TagPill'
import { FadeIn, Stagger, HoverLift } from '@/components/MotionPrimitives'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/AuthContext'

const PAGE_SIZE = 6

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const { data, isLoading } = usePosts(page, PAGE_SIZE)
  const { data: tags } = useTags()
  const { data: stats } = useSiteStats()

  const posts = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hotTags = (tags || []).filter((t) => (t.post_count ?? 0) > 0).slice(0, 10)

  return (
    <div>
      {/* ============ Hero ============ */}
      <section
        className="relative overflow-hidden border-b border-border"
        style={{ backgroundColor: 'var(--hero)', color: 'var(--hero-foreground)' }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 25%, oklch(0.75 0.18 60) 0, transparent 42%), radial-gradient(circle at 85% 75%, oklch(0.65 0.16 40) 0, transparent 45%)',
          }}
        />
        <div className="container relative" style={{ padding: 'var(--spacing-3xl) 1rem' }}>
          <FadeIn>
            <div
              className="inline-flex items-center rounded-full border border-white/20 bg-white/10 text-xs font-medium backdrop-blur"
              style={{ gap: '0.4rem', padding: '0.35rem 0.9rem', marginBottom: 'var(--spacing-lg)' }}
            >
              <Sparkles size={13} />
              持续写作 · 保持好奇
            </div>
          </FadeIn>
          <FadeIn delay={0.05}>
            <h1
              className="font-serif font-bold leading-[1.15] tracking-tight"
              style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', maxWidth: '42rem' }}
            >
              在代码与思考之间，
              <br />
              留下成长的<span style={{ color: 'oklch(0.82 0.15 70)' }}>墨迹</span>。
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p
              className="text-base opacity-85"
              style={{ marginTop: 'var(--spacing-lg)', maxWidth: '36rem', lineHeight: 1.8 }}
            >
              这里记录我在前端工程、后端架构与 AI 应用上的实践与反思。
              愿每一篇文字，都是通往更好自己的一小步。
            </p>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div className="flex flex-wrap items-center" style={{ gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-xl)' }}>
              <Button
                size="lg"
                style={{ gap: 'var(--spacing-xs)' }}
                onClick={() => document.getElementById('feed')?.scrollIntoView({ behavior: 'smooth' })}
              >
                浏览文章 <ArrowRight size={16} />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/5 text-inherit hover:bg-white/15 hover:text-inherit"
                style={{ gap: 'var(--spacing-xs)' }}
                onClick={() => navigate(user ? '/write' : '/login')}
              >
                <PenLine size={16} /> 开始写作
              </Button>
            </div>
          </FadeIn>

          {/* Stats */}
          <FadeIn delay={0.2}>
            <div
              className="flex flex-wrap"
              style={{ gap: 'var(--spacing-2xl)', marginTop: 'var(--spacing-2xl)' }}
            >
              {[
                { label: '篇文章', value: stats?.post_count ?? total },
                { label: '个标签', value: stats?.tag_count ?? (tags?.length || 0) },
                { label: '次阅读', value: stats?.total_views ?? 0 },
              ].map((s) => (
                <div key={s.label}>
                  <div className="font-serif font-bold" style={{ fontSize: '1.9rem' }}>
                    {s.value}
                  </div>
                  <div className="text-xs opacity-70">{s.label}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============ Feed ============ */}
      <section id="feed" className="container" style={{ padding: 'var(--spacing-3xl) 1rem' }}>
        <div className="grid gap-10 lg:grid-cols-[1fr_18rem]">
          {/* Main column */}
          <div>
            <FadeIn>
              <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 className="font-serif font-semibold inline-flex items-center" style={{ fontSize: '1.6rem', gap: 'var(--spacing-xs)' }}>
                  <TrendingUp size={20} className="text-primary" /> 最新文章
                </h2>
                <span className="text-sm text-muted-foreground">共 {total} 篇</span>
              </div>
            </FadeIn>

            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-80 rounded-xl" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <EmptyFeed />
            ) : (
              <Stagger className="grid gap-6 sm:grid-cols-2">
                {posts.map((p) => (
                  <HoverLift key={p.id}>
                    <PostCard post={p} />
                  </HoverLift>
                ))}
              </Stagger>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center" style={{ gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-2xl)' }}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  上一页
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={
                      'flex items-center justify-center rounded-lg text-sm font-medium transition-colors ' +
                      (page === i + 1
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground')
                    }
                    style={{ width: '2.25rem', height: '2.25rem' }}
                  >
                    {i + 1}
                  </button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  下一页
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col" style={{ gap: 'var(--spacing-xl)' }}>
            <SidebarCard title="热门标签">
              {hotTags.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无标签</p>
              ) : (
                <div className="flex flex-wrap" style={{ gap: '0.45rem' }}>
                  {hotTags.map((t) => (
                    <TagPill key={t.id} tag={t} />
                  ))}
                </div>
              )}
              <Link
                to="/tags"
                className="inline-flex items-center text-sm text-primary hover:underline mt-1"
                style={{ gap: '0.25rem', marginTop: 'var(--spacing-md)' }}
              >
                查看全部标签 <ArrowRight size={14} />
              </Link>
            </SidebarCard>

            <SidebarCard title="关于博主">
              <div className="flex items-start" style={{ gap: 'var(--spacing-sm)' }}>
                <div
                  className="flex items-center justify-center rounded-full bg-primary/12 text-primary font-serif font-semibold shrink-0"
                  style={{ width: '3rem', height: '3rem', fontSize: '1.3rem' }}
                >
                  墨
                </div>
                <div className="flex flex-col" style={{ gap: '0.3rem' }}>
                  <span className="font-medium text-sm">墨迹</span>
                  <p className="text-sm text-muted-foreground" style={{ lineHeight: 1.7 }}>
                    前端工程师，热爱把复杂问题讲简单。
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full" style={{ marginTop: 'var(--spacing-md)' }} onClick={() => navigate('/about')}>
                了解更多
              </Button>
            </SidebarCard>
          </aside>
        </div>
      </section>
    </div>
  )
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <FadeIn>
      <div
        className="rounded-xl border border-border bg-card shadow-sm"
        style={{ padding: 'var(--spacing-lg)' }}
      >
        <h3 className="font-serif font-semibold" style={{ fontSize: '1.05rem', marginBottom: 'var(--spacing-md)' }}>
          {title}
        </h3>
        {children}
      </div>
    </FadeIn>
  )
}

function EmptyFeed() {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border text-center"
      style={{ padding: 'var(--spacing-3xl) var(--spacing-lg)', gap: 'var(--spacing-sm)' }}
    >
      <div
        className="flex items-center justify-center rounded-full bg-accent text-primary"
        style={{ width: '3.5rem', height: '3.5rem' }}
      >
        <PenLine size={24} />
      </div>
      <h3 className="font-serif font-semibold" style={{ fontSize: '1.2rem' }}>
        还没有文章
      </h3>
      <p className="text-sm text-muted-foreground" style={{ maxWidth: '24rem' }}>
        登录后即可写下第一篇文章，开始你的技术成长记录。
      </p>
      <Button className="mt-2" onClick={() => (window.location.href = '/login')}>
        去登录
      </Button>
    </div>
  )
}
