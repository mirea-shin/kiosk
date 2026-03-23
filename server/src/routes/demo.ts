import { Hono } from 'hono'
import { readdir, unlink } from 'fs/promises'
import { join } from 'path'
import type Database from 'better-sqlite3'
import type { WsManager } from '../ws-manager.js'
import { initSchema } from '../db.js'

const UPLOADS_DIR = join(process.cwd(), 'uploads', 'screensaver')

export function demoRouter(db: Database.Database, ws: WsManager) {
  const app = new Hono()

  // 포트폴리오 데모 초기화: 주문 유지, 설정만 원상복구
  app.post('/refresh', async (c) => {
    // 1. 스크린세이버 미디어 파일 삭제
    try {
      const files = await readdir(UPLOADS_DIR)
      await Promise.all(files.map((f) => unlink(join(UPLOADS_DIR, f))))
    } catch { /* 디렉토리 없으면 무시 */ }

    // 2. DB 초기화 (주문 제외)
    db.exec(`
      DELETE FROM screensaver_media;
      DELETE FROM screensaver_changelog;
      UPDATE screensaver_config SET
        idle_timeout_seconds = 60,
        last_modified_at = NULL,
        last_published_at = NULL,
        updated_at = datetime('now')
      WHERE id = 1;
      UPDATE branding_config SET
        primary_color = '#f97316',
        updated_at = datetime('now')
      WHERE id = 1;
      DELETE FROM menu_options;
      DELETE FROM menus;
      DELETE FROM categories;
    `)

    // 3. 메뉴 씨드 복원
    const cat1 = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)').run('버거', 0)
    const cat2 = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)').run('사이드', 1)
    const cat3 = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)').run('음료', 2)

    const menu1 = db.prepare(
      'INSERT INTO menus (category_id, name, description, price, is_available, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(cat1.lastInsertRowid, '클래식 버거', '클래식 소고기 패티 버거', 8900, 1, 0)
    const menu2 = db.prepare(
      'INSERT INTO menus (category_id, name, description, price, is_available, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(cat1.lastInsertRowid, '치즈 버거', '치즈가 듬뿍 들어간 버거', 9900, 1, 1)
    const menu3 = db.prepare(
      'INSERT INTO menus (category_id, name, description, price, is_available, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(cat2.lastInsertRowid, '감자튀김', '바삭한 황금빛 감자튀김', 3500, 1, 0)
    db.prepare(
      'INSERT INTO menus (category_id, name, description, price, is_available, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(cat2.lastInsertRowid, '어니언링', '바삭한 어니언링', 4000, 1, 1)
    db.prepare(
      'INSERT INTO menus (category_id, name, description, price, is_available, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(cat3.lastInsertRowid, '콜라', '시원한 콜라', 2000, 1, 0)
    db.prepare(
      'INSERT INTO menus (category_id, name, description, price, is_available, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(cat3.lastInsertRowid, '오렌지 주스', '신선한 오렌지 주스', 2500, 1, 1)

    db.prepare('INSERT INTO menu_options (menu_id, name, price) VALUES (?, ?, ?)').run(menu1.lastInsertRowid, '패티 추가', 2000)
    db.prepare('INSERT INTO menu_options (menu_id, name, price) VALUES (?, ?, ?)').run(menu1.lastInsertRowid, '치즈 추가', 500)
    db.prepare('INSERT INTO menu_options (menu_id, name, price) VALUES (?, ?, ?)').run(menu2.lastInsertRowid, '더블 패티', 3000)
    db.prepare('INSERT INTO menu_options (menu_id, name, price) VALUES (?, ?, ?)').run(menu3.lastInsertRowid, '라지 업그레이드', 500)

    // 4. 키오스크에 변경사항 즉시 반영
    ws.broadcast('branding:sync', { primary_color: '#f97316' })
    ws.broadcast('screensaver:sync', {})

    return c.json({ success: true })
  })

  app.post('/reset', (c) => {
    // Drop all tables and recreate schema
    db.exec(`
      DROP TABLE IF EXISTS order_item_options;
      DROP TABLE IF EXISTS order_items;
      DROP TABLE IF EXISTS orders;
      DROP TABLE IF EXISTS menu_options;
      DROP TABLE IF EXISTS menus;
      DROP TABLE IF EXISTS categories;
      DROP TABLE IF EXISTS screensaver_config;
    `)
    initSchema(db)

    // Seed categories
    const cat1 = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)').run('버거', 0)
    const cat2 = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)').run('사이드', 1)
    const cat3 = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)').run('음료', 2)

    // Seed menus
    const menu1 = db
      .prepare(
        'INSERT INTO menus (category_id, name, description, price, is_available, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(cat1.lastInsertRowid, '클래식 버거', '클래식 소고기 패티 버거', 8900, 1, 0)
    const menu2 = db
      .prepare(
        'INSERT INTO menus (category_id, name, description, price, is_available, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(cat1.lastInsertRowid, '치즈 버거', '치즈가 듬뿍 들어간 버거', 9900, 1, 1)
    const menu3 = db
      .prepare(
        'INSERT INTO menus (category_id, name, description, price, is_available, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(cat2.lastInsertRowid, '감자튀김', '바삭한 황금빛 감자튀김', 3500, 1, 0)
    const menu4 = db
      .prepare(
        'INSERT INTO menus (category_id, name, description, price, is_available, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(cat2.lastInsertRowid, '어니언링', '바삭한 어니언링', 4000, 1, 1)
    const menu5 = db
      .prepare(
        'INSERT INTO menus (category_id, name, description, price, is_available, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(cat3.lastInsertRowid, '콜라', '시원한 콜라', 2000, 1, 0)
    const menu6 = db
      .prepare(
        'INSERT INTO menus (category_id, name, description, price, is_available, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(cat3.lastInsertRowid, '오렌지 주스', '신선한 오렌지 주스', 2500, 1, 1)

    // Seed menu options
    const opt1 = db
      .prepare('INSERT INTO menu_options (menu_id, name, price) VALUES (?, ?, ?)')
      .run(menu1.lastInsertRowid, '패티 추가', 2000)
    const opt2 = db
      .prepare('INSERT INTO menu_options (menu_id, name, price) VALUES (?, ?, ?)')
      .run(menu1.lastInsertRowid, '치즈 추가', 500)
    const opt3 = db
      .prepare('INSERT INTO menu_options (menu_id, name, price) VALUES (?, ?, ?)')
      .run(menu2.lastInsertRowid, '더블 패티', 3000)

    // Seed orders
    const order1 = db
      .prepare("INSERT INTO orders (status, total_price, created_at) VALUES (?, ?, datetime('now'))")
      .run('completed', 12400)
    const orderItem1 = db
      .prepare(
        'INSERT INTO order_items (order_id, menu_id, menu_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)',
      )
      .run(order1.lastInsertRowid, menu1.lastInsertRowid, '클래식 버거', 1, 10900)
    db.prepare('INSERT INTO order_item_options (order_item_id, menu_option_id) VALUES (?, ?)').run(
      orderItem1.lastInsertRowid,
      opt1.lastInsertRowid,
    )
    db.prepare(
      'INSERT INTO order_items (order_id, menu_id, menu_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)',
    ).run(order1.lastInsertRowid, menu5.lastInsertRowid, '콜라', 1, 2000)

    const order2 = db
      .prepare("INSERT INTO orders (status, total_price, created_at) VALUES (?, ?, datetime('now'))")
      .run('pending', 21900)
    const orderItem2 = db
      .prepare(
        'INSERT INTO order_items (order_id, menu_id, menu_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)',
      )
      .run(order2.lastInsertRowid, menu2.lastInsertRowid, '치즈 버거', 1, 12900)
    db.prepare('INSERT INTO order_item_options (order_item_id, menu_option_id) VALUES (?, ?)').run(
      orderItem2.lastInsertRowid,
      opt3.lastInsertRowid,
    )
    db.prepare(
      'INSERT INTO order_items (order_id, menu_id, menu_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)',
    ).run(order2.lastInsertRowid, menu3.lastInsertRowid, '감자튀김', 2, 3500)
    db.prepare(
      'INSERT INTO order_items (order_id, menu_id, menu_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)',
    ).run(order2.lastInsertRowid, menu6.lastInsertRowid, '오렌지 주스', 1, 2500)

    return c.json({ success: true, message: 'Demo data reset complete' })
  })

  return app
}
