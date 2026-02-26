import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { initSchema } from './db.js'
import { createApp } from './app.js'

const mockWsManager = {
  add: () => {},
  remove: () => {},
  broadcast: () => {},
}

function createTestApp() {
  const db = new Database(':memory:')
  initSchema(db)
  const app = createApp(db, mockWsManager)
  return { app, db }
}

describe('Health', () => {
  it('GET /health returns ok', async () => {
    const { app } = createTestApp()
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
  })
})

describe('Categories', () => {
  let app: ReturnType<typeof createTestApp>['app']

  beforeEach(() => {
    ;({ app } = createTestApp())
  })

  it('GET /api/categories returns empty array initially', async () => {
    const res = await app.request('/api/categories')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBe(0)
  })

  it('POST /api/categories creates a category', async () => {
    const res = await app.request('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '버거', sort_order: 0 }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.name).toBe('버거')
    expect(body.id).toBeDefined()
  })

  it('POST /api/categories requires name', async () => {
    const res = await app.request('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })

  it('PUT /api/categories/:id updates a category', async () => {
    const createRes = await app.request('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '버거' }),
    })
    const created = await createRes.json()

    const updateRes = await app.request(`/api/categories/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '스낵' }),
    })
    expect(updateRes.status).toBe(200)
    const updated = await updateRes.json()
    expect(updated.name).toBe('스낵')
  })

  it('DELETE /api/categories/:id deletes a category', async () => {
    const createRes = await app.request('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '버거' }),
    })
    const created = await createRes.json()

    const deleteRes = await app.request(`/api/categories/${created.id}`, { method: 'DELETE' })
    expect(deleteRes.status).toBe(200)

    const getRes = await app.request('/api/categories')
    const list = await getRes.json()
    expect(list.length).toBe(0)
  })
})

describe('Menus', () => {
  let app: ReturnType<typeof createTestApp>['app']
  let categoryId: number

  beforeEach(async () => {
    ;({ app } = createTestApp())
    const res = await app.request('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '버거' }),
    })
    const cat = await res.json()
    categoryId = cat.id
  })

  it('GET /api/menus returns empty array initially', async () => {
    const res = await app.request('/api/menus')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  it('POST /api/menus creates a menu with options array', async () => {
    const res = await app.request('/api/menus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_id: categoryId, name: '클래식 버거', price: 8900 }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.name).toBe('클래식 버거')
    expect(body.is_available).toBe(true)
    expect(Array.isArray(body.options)).toBe(true)
  })

  it('GET /api/menus?category_id= filters by category', async () => {
    await app.request('/api/menus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_id: categoryId, name: '버거1', price: 8000 }),
    })

    const res = await app.request(`/api/menus?category_id=${categoryId}`)
    const body = await res.json()
    expect(body.length).toBe(1)
  })

  it('POST /:id/options adds option to menu', async () => {
    const createRes = await app.request('/api/menus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_id: categoryId, name: '버거', price: 8000 }),
    })
    const menu = await createRes.json()

    const optRes = await app.request(`/api/menus/${menu.id}/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '치즈 추가', price: 500 }),
    })
    expect(optRes.status).toBe(201)

    const getRes = await app.request(`/api/menus/${menu.id}`)
    const fetched = await getRes.json()
    expect(fetched.options.length).toBe(1)
    expect(fetched.options[0].name).toBe('치즈 추가')
  })
})

describe('Orders', () => {
  let app: ReturnType<typeof createTestApp>['app']
  let menuId: number
  let optionId: number

  beforeEach(async () => {
    ;({ app } = createTestApp())
    const catRes = await app.request('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '버거' }),
    })
    const cat = await catRes.json()

    const menuRes = await app.request('/api/menus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_id: cat.id, name: '클래식 버거', price: 8900 }),
    })
    const menu = await menuRes.json()
    menuId = menu.id

    const optRes = await app.request(`/api/menus/${menuId}/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '치즈 추가', price: 500 }),
    })
    const opt = await optRes.json()
    optionId = opt.id
  })

  it('GET /api/orders returns empty array initially', async () => {
    const res = await app.request('/api/orders')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  it('POST /api/orders creates order and calculates total', async () => {
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ menu_id: menuId, quantity: 2, option_ids: [optionId] }],
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    // (8900 + 500) * 2 = 18800
    expect(body.total_price).toBe(18800)
    expect(body.status).toBe('pending')
    expect(body.items.length).toBe(1)
  })

  it('PATCH /api/orders/:id/status changes status', async () => {
    const createRes = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ menu_id: menuId, quantity: 1 }],
      }),
    })
    const order = await createRes.json()

    const patchRes = await app.request(`/api/orders/${order.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'accepted' }),
    })
    expect(patchRes.status).toBe(200)
    const updated = await patchRes.json()
    expect(updated.status).toBe('accepted')
  })

  it('PATCH /api/orders/:id/status rejects invalid status', async () => {
    const createRes = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ menu_id: menuId, quantity: 1 }],
      }),
    })
    const order = await createRes.json()

    const patchRes = await app.request(`/api/orders/${order.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'invalid_status' }),
    })
    expect(patchRes.status).toBe(400)
  })

  it('GET /api/orders?status= filters orders', async () => {
    await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ menu_id: menuId, quantity: 1 }] }),
    })

    const res = await app.request('/api/orders?status=pending')
    const body = await res.json()
    expect(body.length).toBe(1)

    const res2 = await app.request('/api/orders?status=completed')
    const body2 = await res2.json()
    expect(body2.length).toBe(0)
  })
})

describe('Screensaver', () => {
  let app: ReturnType<typeof createTestApp>['app']

  beforeEach(() => {
    ;({ app } = createTestApp())
  })

  it('GET /api/screensaver returns default config', async () => {
    const res = await app.request('/api/screensaver')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.idle_timeout_seconds).toBe(60)
  })

  it('PUT /api/screensaver updates config', async () => {
    const res = await app.request('/api/screensaver', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idle_timeout_seconds: 120 }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.idle_timeout_seconds).toBe(120)
  })
})

describe('Demo', () => {
  let app: ReturnType<typeof createTestApp>['app']

  beforeEach(() => {
    ;({ app } = createTestApp())
  })

  it('POST /api/demo/reset seeds demo data', async () => {
    const res = await app.request('/api/demo/reset', { method: 'POST' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)

    const catRes = await app.request('/api/categories')
    const categories = await catRes.json()
    expect(categories.length).toBe(3)

    const menuRes = await app.request('/api/menus')
    const menus = await menuRes.json()
    expect(menus.length).toBe(6)

    const orderRes = await app.request('/api/orders')
    const orders = await orderRes.json()
    expect(orders.length).toBe(2)
  })
})
