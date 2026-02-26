import { Hono } from 'hono'
import type Database from 'better-sqlite3'
import type { Menu, MenuOption } from '@kiosk/shared'

// DB row: is_available는 SQLite INTEGER(0/1)로 반환됨
type MenuRow = Omit<Menu, 'is_available'> & { is_available: number }

function attachOptions(db: Database.Database, menus: MenuRow[]): Menu[] {
  return menus.map(menu => ({
    ...menu,
    is_available: menu.is_available === 1,
    options: db.prepare('SELECT * FROM menu_options WHERE menu_id = ?').all(menu.id) as MenuOption[],
  }))
}

export function menusRouter(db: Database.Database) {
  const app = new Hono()

  app.get('/', (c) => {
    const categoryId = c.req.query('category_id')
    let menus: MenuRow[]
    if (categoryId) {
      menus = db
        .prepare('SELECT * FROM menus WHERE category_id = ? ORDER BY sort_order ASC')
        .all(Number(categoryId)) as MenuRow[]
    } else {
      menus = db.prepare('SELECT * FROM menus ORDER BY sort_order ASC').all() as MenuRow[]
    }
    return c.json(attachOptions(db, menus))
  })

  app.get('/:id', (c) => {
    const id = Number(c.req.param('id'))
    const menu = db.prepare('SELECT * FROM menus WHERE id = ?').get(id) as MenuRow | undefined
    if (!menu) return c.json({ error: 'Not found' }, 404)
    const [result] = attachOptions(db, [menu])
    return c.json(result)
  })

  app.post('/', async (c) => {
    const body = await c.req.json<{
      category_id: number
      name: string
      description?: string
      price: number
      image_url?: string
      is_available?: boolean
      sort_order?: number
    }>()
    if (!body.name || body.category_id == null || body.price == null) {
      return c.json({ error: 'category_id, name, price are required' }, 400)
    }
    const result = db
      .prepare(
        'INSERT INTO menus (category_id, name, description, price, image_url, is_available, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .run(
        body.category_id,
        body.name,
        body.description ?? '',
        body.price,
        body.image_url ?? null,
        body.is_available !== false ? 1 : 0,
        body.sort_order ?? 0,
      )
    const menu = db.prepare('SELECT * FROM menus WHERE id = ?').get(result.lastInsertRowid) as MenuRow
    const [withOptions] = attachOptions(db, [menu])
    return c.json(withOptions, 201)
  })

  app.put('/:id', async (c) => {
    const id = Number(c.req.param('id'))
    const existing = db.prepare('SELECT * FROM menus WHERE id = ?').get(id) as MenuRow | undefined
    if (!existing) return c.json({ error: 'Not found' }, 404)
    const body = await c.req.json<Partial<Omit<Menu, 'id' | 'created_at'>>>()
    const isAvailable =
      body.is_available !== undefined ? (body.is_available ? 1 : 0) : null
    db.prepare(
      `UPDATE menus SET
        category_id = COALESCE(?, category_id),
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        image_url = COALESCE(?, image_url),
        is_available = COALESCE(?, is_available),
        sort_order = COALESCE(?, sort_order)
      WHERE id = ?`,
    ).run(
      body.category_id ?? null,
      body.name ?? null,
      body.description ?? null,
      body.price ?? null,
      body.image_url ?? null,
      isAvailable,
      body.sort_order ?? null,
      id,
    )
    const menu = db.prepare('SELECT * FROM menus WHERE id = ?').get(id) as MenuRow
    const [withOptions] = attachOptions(db, [menu])
    return c.json(withOptions)
  })

  app.delete('/:id', (c) => {
    const id = Number(c.req.param('id'))
    const existing = db.prepare('SELECT * FROM menus WHERE id = ?').get(id)
    if (!existing) return c.json({ error: 'Not found' }, 404)
    db.prepare('DELETE FROM menus WHERE id = ?').run(id)
    return c.json({ success: true })
  })

  app.post('/:id/options', async (c) => {
    const menuId = Number(c.req.param('id'))
    const existing = db.prepare('SELECT * FROM menus WHERE id = ?').get(menuId)
    if (!existing) return c.json({ error: 'Menu not found' }, 404)
    const body = await c.req.json<Pick<MenuOption, 'name' | 'price'>>()
    if (!body.name) return c.json({ error: 'name is required' }, 400)
    const result = db
      .prepare('INSERT INTO menu_options (menu_id, name, price) VALUES (?, ?, ?)')
      .run(menuId, body.name, body.price ?? 0)
    const option = db
      .prepare('SELECT * FROM menu_options WHERE id = ?')
      .get(result.lastInsertRowid) as MenuOption
    return c.json(option, 201)
  })

  app.delete('/:id/options/:optionId', (c) => {
    const menuId = Number(c.req.param('id'))
    const optionId = Number(c.req.param('optionId'))
    const existing = db
      .prepare('SELECT * FROM menu_options WHERE id = ? AND menu_id = ?')
      .get(optionId, menuId)
    if (!existing) return c.json({ error: 'Not found' }, 404)
    db.prepare('DELETE FROM menu_options WHERE id = ?').run(optionId)
    return c.json({ success: true })
  })

  return app
}
