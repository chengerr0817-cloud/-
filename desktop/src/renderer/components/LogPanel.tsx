import { useEffect, useRef, useState } from 'react'
import type { LogChunk, ServiceName } from '../types'
import { Terminal, Trash } from './icons'

interface Props {
  /** 当前激活的服务 */
  active: ServiceName
  onSwitch: (name: ServiceName) => void
  /** 是否暂停自动滚动 */
  paused: boolean
  onTogglePause: () => void
  /** 由父组件写入的刷新信号：值变化时重新加载日志 */
  reloadKey: number
}

/** 判断日志行级别，用于着色 */
function lineClass(line: string): string {
  if (/\b(error|Error|ERROR|ERR|exception|failed|失败)\b/.test(line)) return 'log-line err'
  if (/\b(warn|Warn|WARN|warning)\b/.test(line)) return 'log-line warn'
  return ''
}

export default function LogPanel({ active, onSwitch, paused, onTogglePause, reloadKey }: Props) {
  const [text, setText] = useState('')
  const [size, setSize] = useState(0)
  const [autoScroll, setAutoScroll] = useState(true)

  const bodyRef = useRef<HTMLDivElement>(null)
  const sizeRef = useRef(0)
  const activeRef = useRef<ServiceName>(active)
  activeRef.current = active

  /* 切换服务或收到 reloadKey 时全量重载 */
  useEffect(() => {
    let cancelled = false
    sizeRef.current = 0
    setSize(0)
    setText('')

    void window.moji.logTail(active).then((chunk: LogChunk) => {
      if (cancelled) return
      sizeRef.current = chunk.size
      setSize(chunk.size)
      setText(chunk.content)
    })

    return () => {
      cancelled = true
    }
  }, [active, reloadKey])

  /* 增量轮询：每 1.2 秒拉一次新增内容 */
  useEffect(() => {
    if (paused) return

    const timer = window.setInterval(() => {
      void window.moji.logSince(activeRef.current, sizeRef.current).then((chunk) => {
        if (chunk.size < sizeRef.current) {
          // 日志被清空或轮转，做一次全量重载
          sizeRef.current = 0
          setSize(0)
          setText('')
          return
        }
        if (!chunk.content) return
        sizeRef.current = chunk.size
        setSize(chunk.size)
        setText((prev) => prev + chunk.content)
      })
    }, 1200)

    return () => window.clearInterval(timer)
  }, [paused])

  /* 自动滚到底部 */
  useEffect(() => {
    if (!autoScroll || paused) return
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [text, autoScroll, paused])

  const handleClear = async () => {
    await window.moji.logClear(active)
    sizeRef.current = 0
    setSize(0)
    setText('')
  }

  const lines = text.length ? text.split('\n') : []

  return (
    <div className="log-panel">
      <div className="log-head">
        <div className="log-tabs">
          <button
            className={`log-tab${active === 'backend' ? ' active' : ''}`}
            onClick={() => onSwitch('backend')}
          >
            后端日志
          </button>
          <button
            className={`log-tab${active === 'frontend' ? ' active' : ''}`}
            onClick={() => onSwitch('frontend')}
          >
            前端日志
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>
            {size ? `${(size / 1024).toFixed(1)} KB` : '0 KB'}
          </span>
          <button className="log-tab" onClick={() => setAutoScroll((v) => !v)}>
            {autoScroll ? '自动滚动 ✓' : '自动滚动 ✗'}
          </button>
          <button className="log-tab" onClick={onTogglePause}>
            {paused ? '继续刷新' : '暂停刷新'}
          </button>
          <button className="log-tab" onClick={() => void handleClear()}>
            <Trash size={12} /> 清空
          </button>
        </div>
      </div>

      <div className="log-body" ref={bodyRef}>
        {lines.length === 0 ? (
          <span className="log-empty">
            <Terminal size={13} /> 暂无日志。启动服务后，输出会实时出现在这里。
          </span>
        ) : (
          lines.map((line, i) => (
            <div key={i} className={lineClass(line)}>
              {line || ' '}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
