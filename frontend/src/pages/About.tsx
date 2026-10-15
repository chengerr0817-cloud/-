import { Link } from 'react-router-dom'
import { BookOpen, Code2, Coffee, Github, Mail, Rss, Sparkles } from 'lucide-react'
import { useSiteStats } from '@/hooks/usePosts'
import { FadeIn } from '@/components/MotionPrimitives'
import { Button } from '@/components/ui/button'

const skills = [
  'TypeScript',
  'React',
  'Node.js',
  'PostgreSQL',
  'CSS / Tailwind',
  '云原生',
  'AI 应用',
  '系统设计',
]

export default function About() {
  const { data: stats } = useSiteStats()

  return (
    <div className="container" style={{ padding: 'var(--spacing-3xl) 1rem', maxWidth: '52rem' }}>
      {/* Intro */}
      <FadeIn>
        <div
          className="flex flex-col sm:flex-row items-center sm:items-start"
          style={{ gap: 'var(--spacing-xl)', marginBottom: 'var(--spacing-2xl)' }}
        >
          <div
            className="flex items-center justify-center rounded-2xl bg-primary text-primary-foreground font-serif font-bold shrink-0"
            style={{ width: '6rem', height: '6rem', fontSize: '2.6rem' }}
          >
            墨
          </div>
          <div>
            <div className="flex items-center" style={{ gap: '0.4rem' }}>
              <h1 className="font-serif font-bold" style={{ fontSize: 'var(--font-size-headline)' }}>
                你好，我是墨迹
              </h1>
              <Sparkles size={20} className="text-primary" />
            </div>
            <p className="text-muted-foreground" style={{ marginTop: 'var(--spacing-sm)', lineHeight: 1.85 }}>
              一名热爱折腾的前端工程师，喜欢把复杂的技术问题讲得简单清晰。
              白天写界面，晚上写架构，偶尔也写点关于成长与思考的文字。
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Stats */}
      <FadeIn delay={0.05}>
        <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-2xl)' }}>
          {[
            { icon: BookOpen, label: '篇文章', value: stats?.post_count ?? 0 },
            { icon: Code2, label: '个标签', value: stats?.tag_count ?? 0 },
            { icon: Coffee, label: '次阅读', value: stats?.total_views ?? 0 },
            { icon: Sparkles, label: '字积累', value: stats?.total_words ?? 0 },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center rounded-xl border border-border bg-card shadow-sm"
              style={{ padding: 'var(--spacing-lg)' }}
            >
              <s.icon size={20} className="text-primary" />
              <div className="font-serif font-bold" style={{ fontSize: '1.5rem', marginTop: 'var(--spacing-xs)' }}>
                {s.value}
              </div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* Skills */}
      <FadeIn delay={0.1}>
        <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <h2 className="font-serif font-semibold" style={{ fontSize: '1.4rem', marginBottom: 'var(--spacing-md)' }}>
            我的技术栈
          </h2>
          <div className="flex flex-wrap" style={{ gap: '0.5rem' }}>
            {skills.map((s) => (
              <span
                key={s}
                className="rounded-lg border border-border bg-secondary text-secondary-foreground text-sm font-medium"
                style={{ padding: '0.35rem 0.85rem' }}
              >
                {s}
              </span>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* About the blog */}
      <FadeIn delay={0.15}>
        <section
          className="rounded-xl border border-border bg-muted"
          style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-2xl)' }}
        >
          <h2 className="font-serif font-semibold" style={{ fontSize: '1.4rem', marginBottom: 'var(--spacing-sm)' }}>
            关于这个博客
          </h2>
          <p className="text-muted-foreground" style={{ lineHeight: 1.9 }}>
            「墨迹」是一个用 React + Express + 腾讯云开发（TCB）搭建的个人博客。
            文章数据存储在云端 PostgreSQL，图片与附件托管在云存储，并支持登录后在线写作。
            这里没有花哨的追踪，只有持续的记录 —— 愿它见证我，也陪伴你，一起慢慢变好。
          </p>
        </section>
      </FadeIn>

      {/* Contact */}
      <FadeIn delay={0.2}>
        <section>
          <h2 className="font-serif font-semibold" style={{ fontSize: '1.4rem', marginBottom: 'var(--spacing-md)' }}>
            找到我
          </h2>
          <div className="flex flex-wrap" style={{ gap: 'var(--spacing-sm)' }}>
            {[
              { href: 'https://github.com', icon: Github, label: 'GitHub' },
              { href: 'mailto:hello@example.com', icon: Mail, label: '邮箱' },
              { href: '/rss.xml', icon: Rss, label: 'RSS 订阅' },
            ].map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
                className="inline-flex items-center rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                style={{ gap: 'var(--spacing-xs)', padding: '0.55rem 1rem' }}
              >
                <c.icon size={16} /> {c.label}
              </a>
            ))}
          </div>
          <div style={{ marginTop: 'var(--spacing-2xl)' }}>
            <Button asChild variant="outline" style={{ gap: 'var(--spacing-xs)' }}>
              <Link to="/">← 回到首页读文章</Link>
            </Button>
          </div>
        </section>
      </FadeIn>
    </div>
  )
}
