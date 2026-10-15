import { contextBridge, ipcRenderer } from 'electron'

/** 暴露给渲染进程的 API。所有能力都经由主进程 IPC，渲染进程无 Node 权限。 */
const api = {
  /** 应用与路径信息 */
  info: () => ipcRenderer.invoke('app:info'),

  /** 服务状态 */
  statusAll: () => ipcRenderer.invoke('service:status-all'),
  status: (name: string) => ipcRenderer.invoke('service:status', name),

  /** 启停 */
  start: (name: string) => ipcRenderer.invoke('service:start', name),
  stop: (name: string) => ipcRenderer.invoke('service:stop', name),
  startAll: () => ipcRenderer.invoke('service:start-all'),
  stopAll: () => ipcRenderer.invoke('service:stop-all'),

  /** 日志 */
  logTail: (name: string) => ipcRenderer.invoke('logs:tail', name),
  logSince: (name: string, offset: number) => ipcRenderer.invoke('logs:since', name, offset),
  logClear: (name: string) => ipcRenderer.invoke('logs:clear', name),

  /** 站点数据 */
  stats: () => ipcRenderer.invoke('site:stats'),
  storage: () => ipcRenderer.invoke('site:storage'),

  /** 外部打开 */
  openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),
  openPath: (target: string) => ipcRenderer.invoke('shell:open-path', target),
  pickDirectory: () => ipcRenderer.invoke('dialog:pick-directory'),
}

contextBridge.exposeInMainWorld('moji', api)

export type MojiApi = typeof api
