import Database from 'better-sqlite3'
import { initSchema } from './db.js'

const db = new Database('kiosk.db')
initSchema(db)

type MenuRow = { id: number; name: string; price: number }
type OptionRow = { id: number; name: string; price: number }

const menus = db.prepare('SELECT id, name, price FROM menus WHERE is_available = 1').all() as MenuRow[]
const getOptions = db.prepare('SELECT id, name, price FROM menu_options WHERE menu_id = ?')

function findMenu(name: string) {
  const m = menus.find(m => m.name === name)
  if (!m) throw new Error(`메뉴 없음: ${name}`)
  return m
}

function findOption(menuId: number, optionName: string): OptionRow | undefined {
  const opts = getOptions.all(menuId) as OptionRow[]
  return opts.find(o => o.name === optionName)
}

type OrderItem = {
  menu: MenuRow
  option?: OptionRow
  quantity: number
}

function createOrder(status: string, items: OrderItem[]) {
  const totalPrice = items.reduce((sum, { menu, option, quantity }) => {
    return sum + (menu.price + (option?.price ?? 0)) * quantity
  }, 0)

  const orderResult = db
    .prepare("INSERT INTO orders (status, total_price) VALUES (?, ?)")
    .run(status, totalPrice)
  const orderId = orderResult.lastInsertRowid

  for (const { menu, option, quantity } of items) {
    const unitPrice = menu.price + (option?.price ?? 0)
    const itemResult = db
      .prepare('INSERT INTO order_items (order_id, menu_id, menu_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)')
      .run(orderId, menu.id, menu.name, quantity, unitPrice)

    if (option) {
      db.prepare('INSERT INTO order_item_options (order_item_id, menu_option_id) VALUES (?, ?)')
        .run(itemResult.lastInsertRowid, option.id)
    }
  }

  return orderId
}

// --- 주문 데이터 삽입 ---

const 클래식버거 = findMenu('클래식 버거')
const 치즈버거 = findMenu('치즈 버거')
const 더블패티 = findMenu('더블 패티 버거')
const 베이컨버거 = findMenu('베이컨 버거')
const 감자S = findMenu('감자튀김 (S)')
const 감자L = findMenu('감자튀김 (L)')
const 어니언링 = findMenu('어니언링')
const 콜라 = findMenu('콜라')
const 사이다 = findMenu('사이다')
const 아메리카노 = findMenu('아메리카노')
const 아이스크림 = findMenu('아이스크림')
const 애플파이 = findMenu('애플파이')

const 클래식세트L = findOption(클래식버거.id, '세트 (L음료 + 감자튀김L)')
const 클래식단품 = findOption(클래식버거.id, '단품')
const 치즈세트S = findOption(치즈버거.id, '세트 (S음료 + 감자튀김S)')
const 더블세트L = findOption(더블패티.id, '세트 (L음료 + 감자튀김L)')
const 베이컨단품 = findOption(베이컨버거.id, '단품')
const 콜라L = findOption(콜라.id, 'L')
const 콜라M = findOption(콜라.id, 'M')
const 아이스 = findOption(아메리카노.id, '아이스')
const 따뜻 = findOption(아메리카노.id, '따뜻하게')
const 초코아이스크림 = findOption(아이스크림.id, '초코')
const 바닐라아이스크림 = findOption(아이스크림.id, '바닐라')

// pending 주문 3개
createOrder('pending', [
  { menu: 클래식버거, option: 클래식세트L, quantity: 1 },
  { menu: 콜라, option: 콜라L, quantity: 1 },
])

createOrder('pending', [
  { menu: 치즈버거, option: 치즈세트S, quantity: 2 },
  { menu: 감자S, quantity: 1 },
])

createOrder('pending', [
  { menu: 더블패티, option: 더블세트L, quantity: 1 },
  { menu: 어니언링, quantity: 1 },
  { menu: 아이스크림, option: 초코아이스크림, quantity: 2 },
])

// accepted 주문 2개
createOrder('accepted', [
  { menu: 베이컨버거, option: 베이컨단품, quantity: 1 },
  { menu: 아메리카노, option: 아이스, quantity: 2 },
])

createOrder('accepted', [
  { menu: 클래식버거, option: 클래식단품, quantity: 3 },
  { menu: 감자L, quantity: 2 },
  { menu: 콜라, option: 콜라M, quantity: 3 },
])

// preparing 주문 1개
createOrder('preparing', [
  { menu: 치즈버거, option: 치즈세트S, quantity: 1 },
  { menu: 아메리카노, option: 따뜻, quantity: 1 },
  { menu: 애플파이, quantity: 1 },
])

// completed 주문 2개
createOrder('completed', [
  { menu: 클래식버거, option: 클래식세트L, quantity: 2 },
  { menu: 아이스크림, option: 바닐라아이스크림, quantity: 2 },
])

createOrder('completed', [
  { menu: 감자S, quantity: 2 },
  { menu: 어니언링, quantity: 1 },
  { menu: 사이다, quantity: 2 },
])

// cancelled 주문 1개
createOrder('cancelled', [
  { menu: 더블패티, option: 더블세트L, quantity: 1 },
])

console.log('✅ 주문 테스트 데이터 삽입 완료')
console.log('   pending: 3건, accepted: 2건, preparing: 1건, completed: 2건, cancelled: 1건')
db.close()
