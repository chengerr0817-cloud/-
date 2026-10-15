import express, { Application } from 'express'
import cors from 'cors'
import compression from 'compression'
import 'express-async-errors'
import path from 'node:path'
import { env } from './config/env.js'
import { initSchema } from './config/database.js'
import { errorHandler } from './middleware/errorHandler.js'
import { httpLogger } from './middleware/logger.js'
import { systemRouter } from './modules/system.js'
import { blogRouter } from './modules/blog.js'
import { authRouter } from './modules/auth.js'
import { uploadRouter, UPLOAD_DIR } from './modules/upload.js'

export const createApp = (): Application => {
  // 建表（幂等）
  initSchema()

  const app = express()

  app.use(httpLogger)

  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN,
      credentials: env.CORS_ORIGIN !== '*',
    })
  )

  app.use(express.json({ limit: '5mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(compression())

  // 上传文件静态服务
  app.use('/uploads', express.static(UPLOAD_DIR))

  // API 路由
  app.use(env.API_PREFIX, systemRouter)
  app.use(`${env.API_PREFIX}/auth`, authRouter)
  app.use(`${env.API_PREFIX}/blog`, blogRouter)
  app.use(`${env.API_PREFIX}/upload`, uploadRouter)

  // 生产单容器部署：托管前端构建产物（若存在）
  const distDir = path.resolve(process.cwd(), '../frontend/dist')
  app.use(express.static(distDir, { fallthrough: true }))
  app.get(/^\/(?!api|uploads).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'), (err) => {
      if (err) res.status(404).end()
    })
  })

  app.use(errorHandler)

  return app
}
