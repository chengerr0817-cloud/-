import { Link } from 'react-router-dom'
import { BookOpen, Github, Mail, Rss } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto" style={{ backgroundColor: 'var(--muted)' }}>
      <div className="container" style={{ padding: 'var(--spacing-2xl) 1rem' }}>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="flex flex-col" style={{ gap: 'var(--spacing-sm)' }}>
            <div className="flex items-center" style={{ gap: 'var(--spacing-xs)' }}>
              <span
                className="flex items-center justify-center rounded-lg bg-primary text-primary-foreground"
                style={{ width: '1.9rem', height: '1.9rem' }}
              >
                <BookOpen size={16} strokeWidth={2.2} />
              </span>
              <span className="font-serif font-semibold" style={{ fontSize: '1.2rem' }}>
                墨迹
              </span>
            </div>
            <p className="text-sm text-muted-foreground" style={{ maxWidth: '20rem' }}>
              记录技术成长与思考 —— 前端工程、后端架构、AI 应用与工程方法论。
            </p>
          </div>

          <div className="flex flex-col" style={{ gap: 'var(--spacing-xs)' }}>
            <h4 className="text-sm font-semibold" style={{ marginBottom: 'var(--spacing-xs)' }}>
              导航
            </h4>
            {[
              { to: '/', label: '首页' },
              { to: '/tags', label: '标签分类' },
              { to: '/about', label: '关于本站' },
              { to: '/write', label: '写文章' },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col" style={{ gap: 'var(--spacing-xs)' }}>
            <h4 className="text-sm font-semibold" style={{ marginBottom: 'var(--spacing-xs)' }}>
              联系
            </h4>
            <div className="flex" style={{ gap: 'var(--spacing-sm)' }}>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="flex items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                style={{ width: '2.25rem', height: '2.25rem' }}
              >
                <Github size={17} />
              </a>
              <a
                href="mailto:hello@example.com"
                aria-label="邮箱"
                className="flex items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                style={{ width: '2.25rem', height: '2.25rem' }}
              >
                <Mail size={17} />
              </a>
              <a
                href="/rss.xml"
                aria-label="RSS"
                className="flex items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                style={{ width: '2.25rem', height: '2.25rem' }}
              >
                <Rss size={17} />
              </a>
            </div>
            <p className="text-xs text-muted-foreground mt-1">持续写作，保持好奇。</p>
          </div>
        </div>

        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground"
          style={{ marginTop: 'var(--spacing-xl)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--border)' }}
        >
          <span>© {new Date().getFullYear()} 墨迹 · 保留所有权利</span>
          <span>由 React · Express · TCB 驱动</span>
        </div>
      </div>
    </footer>
  )
}
