import { Hono } from 'hono'
import type Database from 'better-sqlite3'
import type { WsManager } from '../ws-manager.js'
import type { BrandingConfig } from '@kiosk/shared'

export function brandingRouter(db: Database.Database, ws: WsManager) {
  const app = new Hono()

  app.get('/', (c) => {
    const config = db.prepare('SELECT * FROM branding_config WHERE id = 1').get() as BrandingConfig
    return c.json(config)
  })

  app.put('/', async (c) => {
    const body = await c.req.json<Pick<BrandingConfig, 'primary_color'>>()
    if (!body.primary_color) {
      return c.json({ error: 'primary_color is required' }, 400)
    }
    db.prepare(
      "UPDATE branding_config SET primary_color = ?, updated_at = datetime('now') WHERE id = 1"
    ).run(body.primary_color)
    const config = db.prepare('SELECT * FROM branding_config WHERE id = 1').get() as BrandingConfig
    ws.broadcast('branding:sync', { primary_color: config.primary_color })
    return c.json(config)
  })

  return app
}
