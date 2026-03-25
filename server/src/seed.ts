import Database from 'better-sqlite3'
import { initSchema } from './db.js'

const db = new Database('kiosk.db')
initSchema(db)

const BASE_URL = process.env.SERVER_URL ?? 'http://localhost:3001'
const IMG = (file: string) => `${BASE_URL}/uploads/menus/${file}`

// Categories
const insertCategory = db.prepare(
  'INSERT INTO categories (name, sort_order) VALUES (?, ?)'
)

const cat1 = insertCategory.run('버거', 0)
const cat2 = insertCategory.run('사이드', 1)
const cat3 = insertCategory.run('음료', 2)

// Menus
const insertMenu = db.prepare(
  'INSERT INTO menus (category_id, name, description, price, image_url, is_available, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
)

const m1 = insertMenu.run(cat1.lastInsertRowid, '클래식 버거', '클래식 소고기 패티 버거', 8900, IMG('classic-burger.jpg'), 1, 1)
const m2 = insertMenu.run(cat1.lastInsertRowid, '치즈 버거', '치즈가 듬뿍 들어간 버거', 9900, IMG('cheese-burger.jpg'), 1, 3)

const m3 = insertMenu.run(cat2.lastInsertRowid, '감자튀김', '바삭한 황금빛 감자튀김', 3500, IMG('fries.jpg'), 1, 0)
insertMenu.run(cat2.lastInsertRowid, '어니언링', '바삭한 어니언링', 4000, IMG('onion-rings.jpg'), 1, 1)

insertMenu.run(cat3.lastInsertRowid, '콜라', '시원한 콜라', 2000, IMG('cola.jpg'), 1, 0)
insertMenu.run(cat3.lastInsertRowid, '오렌지 주스', '신선한 오렌지 주스', 2500, IMG('orange-juice.jpg'), 1, 1)

// Menu Options
const insertOption = db.prepare(
  'INSERT INTO menu_options (menu_id, name, price) VALUES (?, ?, ?)'
)

insertOption.run(m1.lastInsertRowid, '패티 추가', 2000)
insertOption.run(m1.lastInsertRowid, '치즈 추가', 500)
insertOption.run(m2.lastInsertRowid, '더블 패티', 3000)
insertOption.run(m3.lastInsertRowid, '라지 업그레이드', 500)

console.log('✅ 시드 데이터 삽입 완료')
console.log('   카테고리: 3개 (버거, 사이드, 음료)')
console.log('   메뉴: 6개')
console.log('   옵션: 4개')
db.close()
