import type { AppInfo } from '../types'
import { ExternalLink, Image, PenLine } from './icons'

interface Props {
  info: AppInfo | null
  frontendRunning: boolean
  onOpenExternal: (url: string) => void
}

export default function QuickLinks({ info, frontendRunning, onOpenExternal }: Props) {
  const base = `http://localhost:${info?.ports.frontend ?? 5173}`

  const links = [
    { icon: <ExternalLink size={14} />, label: '博客首页', path: '/' },
    { icon: <PenLine size={14} />, label: '写文章', path: '/write' },
    { icon: <PenLine size={14} />, label: '文章管理', path: '/my-posts' },
    { icon: <Image size={14} />, label: '图床管理', path: '/uploads' },
  ]

  return (
    <div className="card">
      <div className="card-title">
        <span className="card-title-left">
          <ExternalLink size={15} /> 快捷入口
        </span>
      </div>

      {!frontendRunning && (
        <div className="hint info" style={{ marginBottom: '0.7rem' }}>
          前端未运行，先启动前端服务再打开页面。
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {links.map((l) => (
          <button
            key={l.path}
            className="btn ghost"
            disabled={!frontendRunning}
            style={{ justifyContent: 'flex-start' }}
            onClick={() => onOpenExternal(base + l.path)}
          >
            {l.icon}
            {l.label}
            <span
              style={{
                marginLeft: 'auto',
                fontFamily: 'var(--mono)',
                fontSize: '0.7rem',
                opacity: 0.55,
              }}
            >
              {l.path}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
