import Database from 'better-sqlite3'
import { initSchema } from './db.js'

const db = new Database('kiosk.db')
initSchema(db)

// Categories
const insertCategory = db.prepare(
  'INSERT INTO categories (name, sort_order) VALUES (?, ?)'
)

const cat1 = insertCategory.run('버거', 1)
const cat2 = insertCategory.run('사이드', 2)
const cat3 = insertCategory.run('음료', 3)
const cat4 = insertCategory.run('디저트', 4)

// Menus
const insertMenu = db.prepare(
  'INSERT INTO menus (category_id, name, description, price, image_url, is_available, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
)

const m1 = insertMenu.run(cat1.lastInsertRowid, '클래식 버거', '두툼한 소고기 패티와 신선한 채소의 조화', 8900, null, 1, 1)
const m2 = insertMenu.run(cat1.lastInsertRowid, '치즈 버거', '고소한 체다 치즈가 듬뿍 올라간 버거', 9900, null, 1, 2)
const m3 = insertMenu.run(cat1.lastInsertRowid, '더블 패티 버거', '패티 두 장으로 든든한 한 끼', 12900, null, 1, 3)
const m4 = insertMenu.run(cat1.lastInsertRowid, '베이컨 버거', '바삭한 베이컨이 들어간 스모키 버거', 11900, null, 1, 4)
const m5 = insertMenu.run(cat1.lastInsertRowid, '스파이시 버거', '매콤한 소스와 할라피뇨가 들어간 버거', 10900, null, 0, 5)

const m6 = insertMenu.run(cat2.lastInsertRowid, '감자튀김 (S)', '바삭하게 튀긴 황금빛 감자튀김', 2500, null, 1, 1)
const m7 = insertMenu.run(cat2.lastInsertRowid, '감자튀김 (L)', '바삭하게 튀긴 황금빛 감자튀김 대용량', 3500, null, 1, 2)
const m8 = insertMenu.run(cat2.lastInsertRowid, '어니언링', '바삭한 양파링 튀김', 3000, null, 1, 3)
const m9 = insertMenu.run(cat2.lastInsertRowid, '코울슬로', '신선한 채소로 만든 크리미 코울슬로', 2000, null, 1, 4)

const m10 = insertMenu.run(cat3.lastInsertRowid, '콜라', '시원하고 청량한 콜라', 2000, null, 1, 1)
const m11 = insertMenu.run(cat3.lastInsertRowid, '사이다', '청량한 탄산음료', 2000, null, 1, 2)
const m12 = insertMenu.run(cat3.lastInsertRowid, '아메리카노', '진하고 깊은 커피', 3000, null, 1, 3)
const m13 = insertMenu.run(cat3.lastInsertRowid, '레몬에이드', '새콤달콤 레몬에이드', 3500, null, 1, 4)
const m14 = insertMenu.run(cat3.lastInsertRowid, '밀크쉐이크', '부드러운 바닐라 밀크쉐이크', 4500, null, 1, 5)

const m15 = insertMenu.run(cat4.lastInsertRowid, '아이스크림', '부드러운 소프트아이스크림', 1500, null, 1, 1)
const m16 = insertMenu.run(cat4.lastInsertRowid, '애플파이', '따뜻하게 구운 애플파이', 2500, null, 1, 2)

// Menu Options
const insertOption = db.prepare(
  'INSERT INTO menu_options (menu_id, name, price) VALUES (?, ?, ?)'
)

// 버거 옵션
for (const menuId of [m1.lastInsertRowid, m2.lastInsertRowid, m3.lastInsertRowid, m4.lastInsertRowid]) {
  insertOption.run(menuId, '단품', 0)
  insertOption.run(menuId, '세트 (S음료 + 감자튀김S)', 3000)
  insertOption.run(menuId, '세트 (L음료 + 감자튀김L)', 4000)
}

// 음료 사이즈 옵션
for (const menuId of [m10.lastInsertRowid, m11.lastInsertRowid]) {
  insertOption.run(menuId, 'M', 0)
  insertOption.run(menuId, 'L', 500)
}

insertOption.run(m12.lastInsertRowid, '따뜻하게', 0)
insertOption.run(m12.lastInsertRowid, '아이스', 0)

// 아이스크림 토핑
insertOption.run(m15.lastInsertRowid, '바닐라', 0)
insertOption.run(m15.lastInsertRowid, '초코', 0)
insertOption.run(m15.lastInsertRowid, '딸기', 0)
insertOption.run(m15.lastInsertRowid, '초코 시럽 추가', 500)

console.log('✅ 시드 데이터 삽입 완료')
console.log(`   카테고리: 4개`)
console.log(`   메뉴: 16개 (품절 1개 포함)`)
console.log(`   옵션: 다수`)
db.close()
