import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type Database from 'better-sqlite3'
import type { WsManager } from './ws-manager.js'
import { categoriesRouter } from './routes/categories.js'
import { menusRouter } from './routes/menus.js'
import { ordersRouter } from './routes/orders.js'
import { screensaverRouter } from './routes/screensaver.js'
import { demoRouter } from './routes/demo.js'

export function createApp(db: Database.Database, ws: WsManager) {
  const app = new Hono()

  app.use('*', cors({ origin: '*' }))

  app.route('/api/categories', categoriesRouter(db))
  app.route('/api/menus', menusRouter(db))
  app.route('/api/orders', ordersRouter(db, ws))
  app.route('/api/screensaver', screensaverRouter(db))
  app.route('/api/demo', demoRouter(db))

  app.get('/health', (c) => c.json({ status: 'ok' }))

  return app
}
