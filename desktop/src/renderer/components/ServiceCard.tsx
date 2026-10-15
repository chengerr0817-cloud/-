import type { ServiceStatus } from '../types'
import { Globe, Play, Rotate, Server, Square } from './icons'

/** 状态 → 徽标文案与样式类 */
const STATE_META: Record<
  ServiceStatus['state'],
  { text: string; cls: string; pulse: boolean }
> = {
  running: { text: '运行中', cls: 'running', pulse: true },
  stopped: { text: '已停止', cls: 'stopped', pulse: false },
  starting: { text: '启动中', cls: 'conflict', pulse: true },
  'port-conflict': { text: '端口冲突', cls: 'conflict', pulse: true },
}

interface Props {
  status: ServiceStatus
  busy: boolean
  onStart: () => void
  onStop: () => void
  onRestart: () => void
  onOpen: () => void
}

export default function ServiceCard({
  status,
  busy,
  onStart,
  onStop,
  onRestart,
  onOpen,
}: Props) {
  const meta = STATE_META[status.state]
  const running = status.state === 'running'
  const Icon = status.name === 'backend' ? Server : Globe

  return (
    <div
      className={[
        'service',
        running ? 'running' : '',
        status.state === 'port-conflict' ? 'conflict' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="service-head">
        <div className="service-name">
          <Icon size={16} />
          {status.label}
        </div>
        <span className={`badge ${meta.cls}`}>
          <i className={`dot${meta.pulse ? ' pulse' : ''}`} />
          {meta.text}
        </span>
      </div>

      <div className="service-meta">
        <span>
          端口 <b>:{status.port}</b>
        </span>
        <span>
          PID <b>{status.pid ?? '—'}</b>
        </span>
        <span>
          健康检查 <b>{status.httpCode ?? '—'}</b>
        </span>
        <span>
          地址{' '}
          <b style={{ fontFamily: 'var(--mono)' }}>
            {status.name === 'backend' ? '/api' : 'localhost'}
          </b>
        </span>
      </div>

      {status.state === 'port-conflict' && (
        <div className="hint error">
          <span>端口 {status.port} 被其他程序占用，控制台无法接管。请先关闭该程序。</span>
        </div>
      )}

      <div className="service-actions">
        {running ? (
          <>
            <button className="btn sm" disabled={busy} onClick={onStop}>
              <Square size={13} /> 停止
            </button>
            <button className="btn sm" disabled={busy} onClick={onRestart}>
              <Rotate size={13} /> 重启
            </button>
            <button className="btn sm primary" disabled={busy} onClick={onOpen}>
              打开
            </button>
          </>
        ) : (
          <button className="btn sm primary" disabled={busy} onClick={onStart}>
            <Play size={13} /> 启动
          </button>
        )}
      </div>
    </div>
  )
}
