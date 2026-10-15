import { app, BrowserWindow, ipcMain, shell, dialog, Tray, Menu, nativeImage } from 'electron'
import path from 'node:path'
import { existsSync } from 'node:fs'
import {
  resolvePaths,
  ensureDirs,
  getAllStatus,
  getStatus,
  startService,
  stopService,
  readTail,
  readSince,
  clearLog,
  logPath,
  fetchStats,
  dbSize,
  uploadCount,
  type Ports,
  type ServiceName,
} from './service-manager.js'

/* ------------------------------------------------------------------ *
 * 全局状态
 * ------------------------------------------------------------------ */

const DEV_URL = process.env.MOJI_DEV_URL || 'http://localhost:5273'
const isDev = !app.isPackaged

const paths = resolvePaths(__dirname)
ensureDirs(paths)

const ports: Ports = {
  backend: Number(process.env.BACKEND_PORT) || 3000,
  frontend: Number(process.env.FRONTEND_PORT) || 5173,
}

let win: BrowserWindow | null = null
let tray: Tray | null = null
let quitting = false

/* ------------------------------------------------------------------ *
 * 图标：优先用项目内 svg，缺失时用 1x1 透明占位，避免启动崩溃
 * ------------------------------------------------------------------ */

function trayIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
  <rect width="22" height="22" rx="5" fill="#E08A2B"/>
  <text x="11" y="16" font-size="13" font-family="serif" font-weight="700"
        text-anchor="middle" fill="#FFF7E8">墨</text>
</svg>`
  return nativeImage.createFromDataURL(
    `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  )
}

/* ------------------------------------------------------------------ *
 * 窗口
 * ------------------------------------------------------------------ */

function createWindow(): void {
  win = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 900,
    minHeight: 620,
    backgroundColor: '#FDF8EE',
    title: '墨迹博客 · 桌面控制台',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  win.once('ready-to-show', () => win?.show())

  // 站内链接走外部浏览器，不在应用内打开
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  // 关闭时最小化到托盘而非退出（服务仍在后台跑）
  win.on('close', (e) => {
    if (!quitting) {
      e.preventDefault()
      win?.hide()
    }
  })

  if (isDev) {
    void win.loadURL(DEV_URL)
  } else {
    void win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

/* ------------------------------------------------------------------ *
 * 托盘
 * ------------------------------------------------------------------ */

function createTray(): void {
  tray = new Tray(trayIcon())
  tray.setToolTip('墨迹博客 · 桌面控制台')

  const menu = Menu.buildFromTemplate([
    {
      label: '显示控制台',
      click: () => {
        win?.show()
        win?.focus()
      },
    },
    {
      label: '打开博客',
      click: () => void shell.openExternal(`http://localhost:${ports.frontend}`),
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        quitting = true
        app.quit()
      },
    },
  ])

  tray.setContextMenu(menu)
  tray.on('click', () => {
    win?.isVisible() ? win.hide() : (win?.show(), win?.focus())
  })
}

/* ------------------------------------------------------------------ *
 * IPC
 * ------------------------------------------------------------------ */

function registerIpc(): void {
  ipcMain.handle('app:info', () => ({
    root: paths.root,
    backendDir: paths.backendDir,
    frontendDir: paths.frontendDir,
    dbFile: paths.dbFile,
    uploadsDir: paths.uploadsDir,
    logDir: paths.logDir,
    ports,
    version: app.getVersion(),
    electron: process.versions.electron,
  }))

  ipcMain.handle('service:status-all', () => getAllStatus(paths, ports))
  ipcMain.handle('service:status', (_e, name: ServiceName) => getStatus(paths, ports, name))

  ipcMain.handle('service:start', (_e, name: ServiceName) => startService(paths, ports, name))
  ipcMain.handle('service:stop', (_e, name: ServiceName) => stopService(paths, ports, name))

  ipcMain.handle('service:start-all', async () => {
    const be = await startService(paths, ports, 'backend')
    if (!be.ok) return be
    const fe = await startService(paths, ports, 'frontend')
    return fe.ok ? { ok: true, message: '前后端均已启动' } : fe
  })

  ipcMain.handle('service:stop-all', async () => {
    // 先停前端，避免代理报错刷屏
    await stopService(paths, ports, 'frontend')
    return stopService(paths, ports, 'backend')
  })

  ipcMain.handle('logs:tail', (_e, name: ServiceName) =>
    readTail(logPath(paths, name), 48 * 1024)
  )
  ipcMain.handle('logs:since', (_e, name: ServiceName, offset: number) =>
    readSince(logPath(paths, name), offset)
  )
  ipcMain.handle('logs:clear', (_e, name: ServiceName) => {
    clearLog(paths, name)
    return { ok: true }
  })

  ipcMain.handle('site:stats', () => fetchStats(ports))
  ipcMain.handle('site:storage', async () => ({
    db: dbSize(paths),
    uploads: await uploadCount(paths),
  }))

  // 打开外部链接 / 本地目录
  ipcMain.handle('shell:open-external', (_e, url: string) => shell.openExternal(url))
  ipcMain.handle('shell:open-path', async (_e, target: string) => {
    const p = target === 'db' ? paths.dbFile : target === 'uploads' ? paths.uploadsDir : target
    if (!existsSync(p)) {
      const dir = path.dirname(p)
      if (existsSync(dir)) return shell.openPath(dir)
      return `路径不存在：${p}`
    }
    return shell.openPath(p)
  })

  ipcMain.handle('dialog:pick-directory', async () => {
    const r = await dialog.showOpenDialog(win!, { properties: ['openDirectory'] })
    return r.canceled ? null : r.filePaths[0]
  })
}

/* ------------------------------------------------------------------ *
 * 生命周期
 * ------------------------------------------------------------------ */

// 单实例：第二次启动时聚焦已有窗口
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    win?.show()
    win?.focus()
  })

  void app.whenReady().then(() => {
    registerIpc()
    createWindow()
    createTray()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
      else win?.show()
    })
  })
}

// 关闭窗口不退出（服务在后台跑），只有显式退出才结束
app.on('window-all-closed', () => {
  if (process.platform === 'darwin') return
  // 保持托盘常驻
})

app.on('before-quit', () => {
  quitting = true
})
