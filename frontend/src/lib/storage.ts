import app, { getRequestToken } from './cloudbase'

/**
 * Upload a file to TCB cloud storage and return its public access URL.
 *
 * File path convention: `blog/{kind}/{timestamp}-{random}.{ext}`
 * Cloud storage is the "云端存储" requirement — images and attachments live there,
 * and only the resulting URL is persisted in the database.
 */
export async function uploadFile(file: File, kind: 'cover' | 'inline' = 'inline'): Promise<string> {
  const token = await getRequestToken()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storage = (app as any).storage()

  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
  const rand = Math.random().toString(36).slice(2, 8)
  const cloudPath = `blog/${kind}/${Date.now()}-${rand}.${ext}`

  const result = await storage.uploadFile({
    cloudPath,
    filePath: file,
    // Pass the user token so RLS / storage permissions apply to the uploader.
    ...(token ? { header: { Authorization: `Bearer ${token}` } } : {}),
  })

  // uploadFile returns { fileID, ... }; derive a direct download URL.
  const fileID = result?.fileID || result?.fileId
  if (!fileID) throw new Error('上传失败：未获取到文件标识')

  const { fileList } = await storage.getTempFileURL({ fileList: [fileID] })
  const url = fileList?.[0]?.tempFileURL || fileList?.[0]?.download_url
  if (!url) throw new Error('上传失败：无法生成访问链接')

  return url as string
}

/** Human-readable file size. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
