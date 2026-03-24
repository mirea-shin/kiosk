import { Hono } from 'hono'
import { randomUUID } from 'crypto'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import type Database from 'better-sqlite3'
import type { Menu, MenuOption } from '@kiosk/shared'
import { UPLOAD_DIR } from '../paths.js'

const UPLOADS_DIR = join(UPLOAD_DIR, 'menus')
const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

function getBaseUrl(c: { req: { url: string } }): string {
  const url = new URL(c.req.url)
  return `${url.protocol}//${url.host}`
}

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
    const maxRow = db
      .prepare('SELECT MAX(sort_order) as max FROM menus WHERE category_id = ?')
      .get(body.category_id) as { max: number | null }
    const sortOrder = (maxRow.max ?? 0) + 1
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
        sortOrder,
      )
    const menu = db.prepare('SELECT * FROM menus WHERE id = ?').get(result.lastInsertRowid) as MenuRow
    const [withOptions] = attachOptions(db, [menu])
    return c.json(withOptions, 201)
  })

  app.post('/upload', async (c) => {
    const formData = await c.req.formData()
    const file = formData.get('file') as File | null
    if (!file) return c.json({ error: 'file is required' }, 400)
    if (!ALLOWED_IMAGE_MIME.includes(file.type)) {
      return c.json({ error: `Unsupported file type: ${file.type}` }, 400)
    }
    if (file.size > MAX_SIZE) {
      return c.json({ error: '파일 크기는 10MB 이하여야 합니다' }, 400)
    }
    const ext = file.name.split('.').pop() ?? 'jpg'
    const filename = `${randomUUID()}.${ext}`
    await writeFile(join(UPLOADS_DIR, filename), Buffer.from(await file.arrayBuffer()))
    return c.json({ url: `${getBaseUrl(c)}/uploads/menus/${filename}` }, 201)
  })

  app.patch('/reorder', async (c) => {
    const body = await c.req.json<{ id: number; sort_order: number }[]>()
    if (!Array.isArray(body)) return c.json({ error: 'Array expected' }, 400)
    const update = db.prepare('UPDATE menus SET sort_order = ? WHERE id = ?')
    const updateAll = db.transaction((items: { id: number; sort_order: number }[]) => {
      for (const item of items) update.run(item.sort_order, item.id)
    })
    updateAll(body)
    return c.json({ success: true })
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
