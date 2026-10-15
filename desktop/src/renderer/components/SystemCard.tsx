import type { AppInfo, StorageInfo } from '../types'
import { Database, Folder, Image, Terminal } from './icons'

interface Props {
  info: AppInfo | null
  storage: StorageInfo | null
  onOpenPath: (target: string) => void
}

/** 路径过长时只显示尾部，避免撑破布局 */
function shorten(p: string, max = 34): string {
  if (p.length <= max) return p
  return `…${p.slice(p.length - max + 1)}`
}

export default function SystemCard({ info, storage, onOpenPath }: Props) {
  return (
    <div className="card">
      <div className="card-title">
        <span className="card-title-left">
          <Database size={15} /> 数据与路径
        </span>
      </div>

      <div className="path-row">
        <span className="path-label">
          <Database size={13} /> 数据库
        </span>
        <span className="path-value" title={info?.dbFile}>
          {storage ? storage.db : '—'}
        </span>
      </div>

      <div className="path-row">
        <span className="path-label">
          <Image size={13} /> 上传文件
        </span>
        <span className="path-value">{storage ? `${storage.uploads} 个` : '—'}</span>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
        <button className="btn sm" onClick={() => onOpenPath('db')}>
          <Database size={13} /> 定位数据库
        </button>
        <button className="btn sm" onClick={() => onOpenPath('uploads')}>
          <Image size={13} /> 打开图床目录
        </button>
        <button className="btn sm" onClick={() => onOpenPath('logs')}>
          <Terminal size={13} /> 打开日志目录
        </button>
        <button className="btn sm" onClick={() => onOpenPath('root')}>
          <Folder size={13} /> 打开项目根目录
        </button>
      </div>

      <div className="path-row" style={{ marginTop: '0.6rem' }}>
        <span className="path-label">
          <Folder size={13} /> 项目根
        </span>
        <span className="path-value" title={info?.root}>
          {info ? shorten(info.root) : '—'}
        </span>
      </div>
    </div>
  )
}
