/* ============================================================
   渲染进程与主进程共享的类型定义
   这里只声明结构，真实数据由 window.moji 经 IPC 返回
   ============================================================ */

export type ServiceName = 'backend' | 'frontend'
export type ServiceState = 'running' | 'stopped' | 'starting' | 'port-conflict'

export interface ServiceStatus {
  name: ServiceName
  label: string
  port: number
  url: string
  state: ServiceState
  pid: number | null
  /** 探测到的 HTTP 状态码，null 表示未响应 */
  httpCode: number | null
  /** 端口被非本脚本管理的进程占用 */
  foreignPort: boolean
}

export interface SiteStats {
  post_count: number
  draft_count: number
  total_views: number
  tag_count: number
  total_words: number
}

export interface AppInfo {
  root: string
  backendDir: string
  frontendDir: string
  dbFile: string
  uploadsDir: string
  logDir: string
  ports: { backend: number; frontend: number }
  version: string
  electron: string
}

export interface StorageInfo {
  db: string
  uploads: number
}

export interface StartResult {
  ok: boolean
  message: string
  status?: ServiceStatus
}

export interface LogChunk {
  content: string
  size: number
}

/** preload 通过 contextBridge 暴露的 API */
export interface MojiApi {
  info: () => Promise<AppInfo>
  statusAll: () => Promise<ServiceStatus[]>
  status: (name: ServiceName) => Promise<ServiceStatus>
  start: (name: ServiceName) => Promise<StartResult>
  stop: (name: ServiceName) => Promise<StartResult>
  startAll: () => Promise<StartResult>
  stopAll: () => Promise<StartResult>
  logTail: (name: ServiceName) => Promise<LogChunk>
  logSince: (name: ServiceName, offset: number) => Promise<LogChunk>
  logClear: (name: ServiceName) => Promise<{ ok: boolean }>
  stats: () => Promise<SiteStats | null>
  storage: () => Promise<StorageInfo>
  openExternal: (url: string) => Promise<void>
  openPath: (target: string) => Promise<string>
  pickDirectory: () => Promise<string | null>
}

declare global {
  interface Window {
    moji: MojiApi
  }
}
