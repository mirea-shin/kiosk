import { Hono } from 'hono'
import type Database from 'better-sqlite3'
import type { ScreensaverConfig } from '@kiosk/shared'

export function screensaverRouter(db: Database.Database) {
  const app = new Hono()

  app.get('/', (c) => {
    const config = db
      .prepare('SELECT * FROM screensaver_config WHERE id = 1')
      .get() as ScreensaverConfig
    return c.json(config)
  })

  app.put('/', async (c) => {
    const body = await c.req.json<Pick<ScreensaverConfig, 'idle_timeout_seconds'>>()
    if (body.idle_timeout_seconds == null) {
      return c.json({ error: 'idle_timeout_seconds is required' }, 400)
    }
    db.prepare(
      "UPDATE screensaver_config SET idle_timeout_seconds = ?, updated_at = datetime('now') WHERE id = 1",
    ).run(body.idle_timeout_seconds)
    const config = db
      .prepare('SELECT * FROM screensaver_config WHERE id = 1')
      .get() as ScreensaverConfig
    return c.json(config)
  })

  return app
}
