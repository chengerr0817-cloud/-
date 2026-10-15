import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  AppInfo,
  ServiceName,
  ServiceStatus,
  SiteStats,
  StartResult,
  StorageInfo,
} from './types'
import ServiceCard from './components/ServiceCard'
import StatsCard from './components/StatsCard'
import LogPanel from './components/LogPanel'
import SystemCard from './components/SystemCard'
import QuickLinks from './components/QuickLinks'
import { Alert, Check, Play, Rotate, Square } from './components/icons'

/** 状态轮询间隔（毫秒） */
const POLL_MS = 2500

export default function App() {
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [statuses, setStatuses] = useState<ServiceStatus[]>([])
  const [stats, setStats] = useState<SiteStats | null>(null)
  const [storage, setStorage] = useState<StorageInfo | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  /** 正在执行操作的服务集合，用于禁用按钮 */
  const [pending, setPending] = useState<Set<ServiceName | 'all'>>(new Set())
  /** 顶部提示条 */
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  /** 日志自动刷新开关 */
  const [logPaused, setLogPaused] = useState(false)
  const [logReload, setLogReload] = useState(0)
  const [logService, setLogService] = useState<ServiceName>('backend')

  const noticeTimer = useRef<number | null>(null)

  const flash = useCallback((kind: 'ok' | 'err', text: string) => {
    setNotice({ kind, text })
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current)
    noticeTimer.current = window.setTimeout(() => setNotice(null), 4200)
  }, [])

  /* ---------- 数据拉取 ---------- */

  const refreshStatus = useCallback(async () => {
    try {
      setStatuses(await window.moji.statusAll())
    } catch {
      /* 主进程未就绪时静默忽略 */
    }
  }, [])

  const refreshStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const [s, st] = await Promise.all([window.moji.stats(), window.moji.storage()])
      setStats(s)
      setStorage(st)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    void window.moji.info().then(setInfo)
    void refreshStatus()
    void refreshStats()
  }, [refreshStatus, refreshStats])

  useEffect(() => {
    const timer = window.setInterval(() => void refreshStatus(), POLL_MS)
    return () => window.clearInterval(timer)
  }, [refreshStatus])

  /* 后端转为 running 时补一次统计数据 */
  const backendRunning = statuses.find((s) => s.name === 'backend')?.state === 'running'
  useEffect(() => {
    if (backendRunning) void refreshStats()
  }, [backendRunning, refreshStats])

  /* ---------- 操作 ---------- */

  const withPending = async (key: ServiceName | 'all', fn: () => Promise<StartResult | void>) => {
    setPending((p) => new Set(p).add(key))
    try {
      const r = await fn()
      if (r && 'ok' in r) flash(r.ok ? 'ok' : 'err', r.message)
      await refreshStatus()
      await refreshStats()
      setLogReload((n) => n + 1)
    } catch (e) {
      flash('err', e instanceof Error ? e.message : '操作失败')
    } finally {
      setPending((p) => {
        const next = new Set(p)
        next.delete(key)
        return next
      })
    }
  }

  const handleStart = (name: ServiceName) => withPending(name, () => window.moji.start(name))
  const handleStop = (name: ServiceName) => withPending(name, () => window.moji.stop(name))

  const handleRestart = (name: ServiceName) =>
    withPending(name, async () => {
      await window.moji.stop(name)
      return window.moji.start(name)
    })

  const handleStartAll = () => withPending('all', () => window.moji.startAll())
  const handleStopAll = () => withPending('all', () => window.moji.stopAll())

  const openExternal = (url: string) => void window.moji.openExternal(url)

  const openPath = (target: string) => void window.moji.openPath(target)

  const busy = pending.size > 0
  const allRunning = statuses.length > 0 && statuses.every((s) => s.state === 'running')

  return (
    <div className="app">
      {/* ---------- 顶部标题栏 ---------- */}
      <header className="titlebar">
        <div className="brand">
          <div className="brand-mark">墨</div>
          <div className="brand-text">
            <span className="brand-title">墨迹博客 · 桌面控制台</span>
            <span className="brand-sub">
              {info ? `Electron ${info.electron} · v${info.version}` : '正在初始化…'}
            </span>
          </div>
        </div>

        <div className="titlebar-actions">
          <button
            className="btn on-hero sm"
            disabled={busy || allRunning}
            onClick={() => void handleStartAll()}
          >
            <Play size={13} /> 全部启动
          </button>
          <button
            className="btn on-hero sm"
            disabled={busy}
            onClick={() => void handleStopAll()}
          >
            <Square size={13} /> 全部停止
          </button>
          <button
            className="btn on-hero sm"
            disabled={busy}
            onClick={() => void withPending('all', async () => {
              await window.moji.stopAll()
              return window.moji.startAll()
            })}
          >
            <Rotate size={13} /> 全部重启
          </button>
        </div>
      </header>

      {/* ---------- 提示条 ---------- */}
      {notice && (
        <div
          className={`hint ${notice.kind === 'ok' ? 'info' : 'error'}`}
          style={{ margin: '0.75rem 1rem 0', flexShrink: 0 }}
        >
          {notice.kind === 'ok' ? <Check size={14} /> : <Alert size={14} />}
          <span>{notice.text}</span>
        </div>
      )}

      {/* ---------- 主体 ---------- */}
      <div className="body">
        {/* 左列：服务与数据 */}
        <div className="col">
          <div className="card">
            <div className="card-title">
              <span className="card-title-left">
                <Rotate size={15} /> 服务状态
              </span>
              <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                {statuses.filter((s) => s.state === 'running').length}/{statuses.length || 2} 运行中
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {statuses.length === 0 ? (
                <div className="center-empty">正在读取服务状态…</div>
              ) : (
                statuses.map((s) => (
                  <ServiceCard
                    key={s.name}
                    status={s}
                    busy={busy}
                    onStart={() => void handleStart(s.name)}
                    onStop={() => void handleStop(s.name)}
                    onRestart={() => void handleRestart(s.name)}
                    onOpen={() =>
                      openExternal(`http://localhost:${s.port}${s.name === 'backend' ? '/api/health' : '/'}`)
                    }
                  />
                ))
              )}
            </div>
          </div>

          <StatsCard stats={stats} loading={statsLoading} />
          <QuickLinks
            info={info}
            frontendRunning={
              statuses.find((s) => s.name === 'frontend')?.state === 'running'
            }
            onOpenExternal={openExternal}
          />
          <SystemCard info={info} storage={storage} onOpenPath={openPath} />
        </div>

        {/* 右列：日志 */}
        <div className="col" style={{ overflow: 'hidden' }}>
          <LogPanel
            active={logService}
            onSwitch={setLogService}
            paused={logPaused}
            onTogglePause={() => setLogPaused((v) => !v)}
            reloadKey={logReload}
          />
        </div>
      </div>
    </div>
  )
}
