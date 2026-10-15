import { spawn, execFile } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, statSync, openSync } from 'node:fs'
import { open } from 'node:fs/promises'
import path from 'node:path'
import http from 'node:http'
import net from 'node:net'

/* ------------------------------------------------------------------ *
 * 类型
 * ------------------------------------------------------------------ */

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

export interface AppPaths {
  root: string
  runDir: string
  logDir: string
  backendDir: string
  frontendDir: string
  dbFile: string
  uploadsDir: string
}

/* ------------------------------------------------------------------ *
 * 路径：从 Electron 打包目录反推项目根
 * ------------------------------------------------------------------ */

/**
 * 定位项目根目录。
 * 打包后 desktop/ 会被收进 resources，因此需要向上查找带 backend/ 的目录。
 */
export function resolvePaths(appRootHint?: string): AppPaths {
  const candidates: string[] = []
  if (appRootHint) candidates.push(path.resolve(appRootHint, '..'))
  candidates.push(path.resolve(process.cwd(), '..'))
  candidates.push(process.cwd())

  let root = candidates.find((c) => existsSync(path.join(c, 'backend'))) ?? process.cwd()

  return {
    root,
    runDir: path.join(root, '.run'),
    logDir: path.join(root, 'logs'),
    backendDir: path.join(root, 'backend'),
    frontendDir: path.join(root, 'frontend'),
    dbFile: path.join(root, 'backend', 'data', 'blog.db'),
    uploadsDir: path.join(root, 'backend', 'uploads'),
  }
}

export function ensureDirs(paths: AppPaths): void {
  for (const d of [paths.runDir, paths.logDir]) {
    if (!existsSync(d)) mkdirSync(d, { recursive: true })
  }
}

/* ------------------------------------------------------------------ *
 * 端口与健康检查
 * ------------------------------------------------------------------ */

/** 探测端口是否被监听。 */
export function isPortBusy(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    const done = (v: boolean) => {
      socket.destroy()
      resolve(v)
    }
    socket.setTimeout(600)
    socket.once('connect', () => done(true))
    socket.once('timeout', () => done(false))
    socket.once('error', () => done(false))
    socket.connect(port, '127.0.0.1')
  })
}

/** 请求一个 URL，返回 HTTP 状态码；失败返回 null。 */
export function probeHttp(url: string, timeoutMs = 2500): Promise<number | null> {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume()
      resolve(res.statusCode ?? null)
    })
    req.setTimeout(timeoutMs, () => {
      req.destroy()
      resolve(null)
    })
    req.on('error', () => resolve(null))
  })
}

/* ------------------------------------------------------------------ *
 * PID 文件
 * ------------------------------------------------------------------ */

function pidFileOf(paths: AppPaths, name: ServiceName): string {
  return path.join(paths.runDir, `${name}.pid`)
}

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

export function readPid(paths: AppPaths, name: ServiceName): number | null {
  const f = pidFileOf(paths, name)
  if (!existsSync(f)) return null
  const raw = readFileSync(f, 'utf-8').trim()
  const pid = Number(raw)
  if (!Number.isFinite(pid) || pid <= 0) return null
  return pidAlive(pid) ? pid : null
}

function writePid(paths: AppPaths, name: ServiceName, pid: number): void {
  writeFileSync(pidFileOf(paths, name), String(pid), 'utf-8')
}

function clearPid(paths: AppPaths, name: ServiceName): void {
  const f = pidFileOf(paths, name)
  if (existsSync(f)) rmSync(f, { force: true })
}

/* ------------------------------------------------------------------ *
 * 服务定义
 * ------------------------------------------------------------------ */

interface ServiceDef {
  name: ServiceName
  label: string
  dir: (p: AppPaths) => string
  env: (p: AppPaths, ports: Ports) => Record<string, string>
  args: string[]
  healthUrl: (ports: Ports) => string
}

export interface Ports {
  backend: number
  frontend: number
}

const DEFS: ServiceDef[] = [
  {
    name: 'backend',
    label: '后端',
    dir: (p) => p.backendDir,
    args: ['tsx', 'src/index.ts'],
    env: (_p, ports) => ({
      PORT: String(ports.backend),
      JWT_SECRET: process.env.JWT_SECRET || 'moji-desktop-secret-change-me',
      NODE_ENV: process.env.NODE_ENV || 'development',
    }),
    healthUrl: (ports) => `http://127.0.0.1:${ports.backend}/api/health`,
  },
  {
    name: 'frontend',
    label: '前端',
    dir: (p) => p.frontendDir,
    args: ['vite', '--host', '127.0.0.1', '--port'],
    env: (_p, ports) => ({ BACKEND_PORT: String(ports.backend) }),
    healthUrl: (ports) => `http://127.0.0.1:${ports.frontend}/`,
  },
]

function defOf(name: ServiceName): ServiceDef {
  const d = DEFS.find((x) => x.name === name)
  if (!d) throw new Error(`未知服务：${name}`)
  return d
}

function portOf(name: ServiceName, ports: Ports): number {
  return name === 'backend' ? ports.backend : ports.frontend
}

function urlOf(name: ServiceName, ports: Ports): string {
  return `http://localhost:${portOf(name, ports)}`
}

/* ------------------------------------------------------------------ *
 * 状态查询
 * ------------------------------------------------------------------ */

export async function getStatus(
  paths: AppPaths,
  ports: Ports,
  name: ServiceName
): Promise<ServiceStatus> {
  const d = defOf(name)
  const port = portOf(name, ports)
  const pid = readPid(paths, name)
  const busy = await isPortBusy(port)

  let state: ServiceState
  if (pid !== null) state = 'running'
  else if (busy) state = 'port-conflict'
  else state = 'stopped'

  // 只有真的在跑才探活，避免无谓等待
  const httpCode = state === 'running' ? await probeHttp(d.healthUrl(ports)) : null

  return {
    name,
    label: d.label,
    port,
    url: urlOf(name, ports),
    state,
    pid,
    httpCode,
    foreignPort: state === 'port-conflict',
  }
}

export async function getAllStatus(paths: AppPaths, ports: Ports): Promise<ServiceStatus[]> {
  return Promise.all(DEFS.map((d) => getStatus(paths, ports, d.name)))
}

/* ------------------------------------------------------------------ *
 * 启动
 * ------------------------------------------------------------------ */

function openLogStream(file: string): number {
  // 追加模式打开，父子进程共用该句柄；detached 子进程会继承它
  return openSync(file, 'a')
}

export interface StartResult {
  ok: boolean
  message: string
  status?: ServiceStatus
}

export async function startService(
  paths: AppPaths,
  ports: Ports,
  name: ServiceName
): Promise<StartResult> {
  const d = defOf(name)
  const port = portOf(name, ports)

  // 已在运行
  if (readPid(paths, name) !== null) {
    return { ok: true, message: `${d.label}已在运行`, status: await getStatus(paths, ports, name) }
  }
  // 端口被别的程序占用
  if (await isPortBusy(port)) {
    return {
      ok: false,
      message: `端口 ${port} 已被其他程序占用，请关闭该程序或改用其他端口`,
    }
  }
  // 依赖是否就绪
  if (!existsSync(path.join(d.dir(paths), 'node_modules'))) {
    return { ok: false, message: `${d.label}依赖未安装，请先在 ${d.dir(paths)} 执行 pnpm install` }
  }

  const logFile = path.join(paths.logDir, `${name}.log`)
  const out = openLogStream(logFile)

  const env = { ...process.env, ...d.env(paths, ports) }
  const args = name === 'frontend' ? [...d.args, String(port)] : d.args

  // detached + unref：让子进程独立于 Electron 存活
  const child = spawn('npx', args, {
    cwd: d.dir(paths),
    env,
    detached: true,
    stdio: ['ignore', out, out],
  })
  child.unref()

  if (child.pid) writePid(paths, name, child.pid)

  // 等端口就绪（最多 20 秒）
  const deadline = Date.now() + 20_000
  while (Date.now() < deadline) {
    if (await isPortBusy(port)) {
      const status = await getStatus(paths, ports, name)
      return { ok: true, message: `${d.label}已启动（PID ${child.pid}）`, status }
    }
    // 进程提前退出 => 启动失败
    if (child.pid && !pidAlive(child.pid)) break
    await sleep(400)
  }

  clearPid(paths, name)
  return { ok: false, message: `${d.label}启动失败，请查看日志排查` }
}

/* ------------------------------------------------------------------ *
 * 停止
 * ------------------------------------------------------------------ */

export async function stopService(
  paths: AppPaths,
  ports: Ports,
  name: ServiceName
): Promise<StartResult> {
  const d = defOf(name)
  const port = portOf(name, ports)
  const pid = readPid(paths, name)

  if (pid === null) {
    clearPid(paths, name)
    // 兜底：清掉占用端口的残留进程
    if (await isPortBusy(port)) {
      await killByPort(port)
      return { ok: true, message: `${d.label}残留进程已清理` }
    }
    return { ok: true, message: `${d.label}未在运行` }
  }

  try {
    process.kill(pid, 'SIGTERM')
  } catch {
    /* 进程可能已消失 */
  }

  // 最多等 3 秒走优雅退出
  const deadline = Date.now() + 3000
  while (Date.now() < deadline && pidAlive(pid)) {
    await sleep(150)
  }
  if (pidAlive(pid)) {
    try {
      process.kill(pid, 'SIGKILL')
    } catch {
      /* ignore */
    }
  }

  // npx / tsx / vite 会派生孙进程，按端口兜底清理
  if (await isPortBusy(port)) await killByPort(port)

  clearPid(paths, name)
  return { ok: true, message: `${d.label}已停止`, status: await getStatus(paths, ports, name) }
}

/** 找出监听某端口的进程并终止（仅 Unix）。 */
function killByPort(port: number): Promise<void> {
  return new Promise((resolve) => {
    execFile('lsof', ['-ti', `:${port}`], (err, stdout) => {
      if (err || !stdout.trim()) return resolve()
      const pids = stdout.trim().split('\n').filter(Boolean)
      for (const p of pids) {
        try {
          process.kill(Number(p), 'SIGKILL')
        } catch {
          /* ignore */
        }
      }
      resolve()
    })
  })
}

/* ------------------------------------------------------------------ *
 * 日志
 * ------------------------------------------------------------------ */

export interface LogChunk {
  content: string
  /** 文件总字节数，用于增量拉取 */
  size: number
}

/** 读取日志尾部。maxBytes 限制单次返回量。 */
export async function readTail(file: string, maxBytes = 64 * 1024): Promise<LogChunk> {
  if (!existsSync(file)) return { content: '', size: 0 }
  const { size } = statSync(file)
  const start = Math.max(0, size - maxBytes)
  const fh = await open(file, 'r')
  try {
    const len = size - start
    const buf = Buffer.alloc(len)
    await fh.read(buf, 0, len, start)
    return { content: buf.toString('utf-8'), size }
  } finally {
    await fh.close()
  }
}

/** 从指定偏移读取新增内容。 */
export async function readSince(file: string, offset: number): Promise<LogChunk> {
  if (!existsSync(file)) return { content: '', size: 0 }
  const { size } = statSync(file)
  if (size <= offset) return { content: '', size }
  const fh = await open(file, 'r')
  try {
    const len = size - offset
    const buf = Buffer.alloc(len)
    await fh.read(buf, 0, len, offset)
    return { content: buf.toString('utf-8'), size }
  } finally {
    await fh.close()
  }
}

export function logPath(paths: AppPaths, name: ServiceName): string {
  return path.join(paths.logDir, `${name}.log`)
}

export function clearLog(paths: AppPaths, name: ServiceName): void {
  writeFileSync(logPath(paths, name), '', 'utf-8')
}

/* ------------------------------------------------------------------ *
 * 站点统计
 * ------------------------------------------------------------------ */

export async function fetchStats(ports: Ports): Promise<SiteStats | null> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${ports.backend}/api/blog/stats`, (res) => {
      let body = ''
      res.setEncoding('utf-8')
      res.on('data', (c) => (body += c))
      res.on('end', () => {
        try {
          resolve(JSON.parse(body) as SiteStats)
        } catch {
          resolve(null)
        }
      })
    })
    req.setTimeout(3000, () => {
      req.destroy()
      resolve(null)
    })
    req.on('error', () => resolve(null))
  })
}

/* ------------------------------------------------------------------ *
 * 工具
 * ------------------------------------------------------------------ */

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/** 数据库文件大小（人类可读）。 */
export function dbSize(paths: AppPaths): string {
  if (!existsSync(paths.dbFile)) return '—'
  const { size } = statSync(paths.dbFile)
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(2)} MB`
}

/** 统计上传文件数量。 */
export async function uploadCount(paths: AppPaths): Promise<number> {
  if (!existsSync(paths.uploadsDir)) return 0
  try {
    const { readdir } = await import('node:fs/promises')
    const files = await readdir(paths.uploadsDir)
    return files.length
  } catch {
    return 0
  }
}
