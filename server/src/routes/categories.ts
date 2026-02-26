import { Hono } from 'hono'
import type Database from 'better-sqlite3'
import type { Category } from '@kiosk/shared'

export function categoriesRouter(db: Database.Database) {
  const app = new Hono()

  app.get('/', (c) => {
    const rows = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all() as Category[]
    return c.json(rows)
  })

  app.post('/', async (c) => {
    const body = await c.req.json<Pick<Category, 'name'> & { sort_order?: number }>()
    if (!body.name) return c.json({ error: 'name is required' }, 400)
    const result = db
      .prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)')
      .run(body.name, body.sort_order ?? 0)
    const row = db
      .prepare('SELECT * FROM categories WHERE id = ?')
      .get(result.lastInsertRowid) as Category
    return c.json(row, 201)
  })

  app.put('/:id', async (c) => {
    const id = Number(c.req.param('id'))
    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id)
    if (!existing) return c.json({ error: 'Not found' }, 404)
    const body = await c.req.json<Partial<Pick<Category, 'name' | 'sort_order'>>>()
    db.prepare(
      'UPDATE categories SET name = COALESCE(?, name), sort_order = COALESCE(?, sort_order) WHERE id = ?',
    ).run(body.name ?? null, body.sort_order ?? null, id)
    const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category
    return c.json(row)
  })

  app.delete('/:id', (c) => {
    const id = Number(c.req.param('id'))
    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id)
    if (!existing) return c.json({ error: 'Not found' }, 404)
    db.prepare('DELETE FROM categories WHERE id = ?').run(id)
    return c.json({ success: true })
  })

  return app
}
