import type { SiteStats } from '../types'
import { Activity } from './icons'

interface Props {
  stats: SiteStats | null
  loading: boolean
}

const num = (n: number | undefined) =>
  typeof n === 'number' ? n.toLocaleString('zh-CN') : '—'

export default function StatsCard({ stats, loading }: Props) {
  return (
    <div className="card">
      <div className="card-title">
        <span className="card-title-left">
          <Activity size={15} /> 站点概览
        </span>
        {loading && <span style={{ fontSize: '0.72rem', opacity: 0.6 }}>读取中…</span>}
      </div>

      {stats ? (
        <div className="stats-grid">
          <div className="stat">
            <div className="stat-value">{num(stats.post_count)}</div>
            <div className="stat-label">已发布文章</div>
          </div>
          <div className="stat">
            <div className="stat-value">{num(stats.draft_count)}</div>
            <div className="stat-label">草稿</div>
          </div>
          <div className="stat">
            <div className="stat-value">{num(stats.tag_count)}</div>
            <div className="stat-label">标签</div>
          </div>
          <div className="stat">
            <div className="stat-value">{num(stats.total_views)}</div>
            <div className="stat-label">累计阅读</div>
          </div>
          <div className="stat" style={{ gridColumn: '1 / -1' }}>
            <div className="stat-value">{num(stats.total_words)}</div>
            <div className="stat-label">累计字数</div>
          </div>
        </div>
      ) : (
        <div className="center-empty">
          {loading ? '正在读取站点数据…' : '后端未运行，暂无数据'}
        </div>
      )}
    </div>
  )
}
