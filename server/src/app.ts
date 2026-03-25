import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from '@hono/node-server/serve-static'
import { dirname } from 'path'
import type Database from 'better-sqlite3'
import type { WsManager } from './ws-manager.js'
import { categoriesRouter } from './routes/categories.js'
import { menusRouter } from './routes/menus.js'
import { ordersRouter } from './routes/orders.js'
import { screensaverRouter } from './routes/screensaver.js'
import { brandingRouter } from './routes/branding.js'
import { demoRouter } from './routes/demo.js'
import { UPLOAD_DIR } from './paths.js'

export function createApp(db: Database.Database, ws: WsManager) {
  const app = new Hono()

  app.use('*', cors({ origin: '*' }))

  // 업로드된 미디어 파일 정적 서빙
  // UPLOAD_DIR = server/uploads/ → root = server/ 로 설정해야
  // /uploads/screensaver/a.jpg → server/uploads/screensaver/a.jpg 로 매핑됨
  app.use('/uploads/*', serveStatic({ root: dirname(UPLOAD_DIR) }))

  app.route('/api/categories', categoriesRouter(db, ws))
  app.route('/api/menus', menusRouter(db, ws))
  app.route('/api/orders', ordersRouter(db, ws))
  app.route('/api/screensaver', screensaverRouter(db, ws))
  app.route('/api/branding', brandingRouter(db, ws))
  app.route('/api/demo', demoRouter(db, ws))

  app.get('/health', (c) => c.json({ status: 'ok' }))

  return app
}
