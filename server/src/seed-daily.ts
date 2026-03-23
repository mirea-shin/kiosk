import type Database from 'better-sqlite3'

type MenuRow = { id: number; name: string; price: number }
type ItemSpec = { menuId: number; menuName: string; price: number; quantity: number }

function createOrder(db: Database.Database, status: string, items: ItemSpec[]) {
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const orderResult = db
    .prepare('INSERT INTO orders (status, total_price) VALUES (?, ?)')
    .run(status, totalPrice)
  const orderId = orderResult.lastInsertRowid
  for (const item of items) {
    db.prepare(
      'INSERT INTO order_items (order_id, menu_id, menu_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)',
    ).run(orderId, item.menuId, item.menuName, item.quantity, item.price)
  }
}

function pick(menus: MenuRow[], i: number): ItemSpec & { quantity: number } {
  const m = menus[i % menus.length]
  return { menuId: m.id, menuName: m.name, price: m.price, quantity: 1 }
}

export function seedDailyOrders(db: Database.Database) {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD (UTC)
  const { count } = db
    .prepare("SELECT COUNT(*) as count FROM orders WHERE date(created_at) = ?")
    .get(today) as { count: number }

  if (count > 0) return // 오늘 이미 시드 완료

  const menus = db
    .prepare('SELECT id, name, price FROM menus WHERE is_available = 1')
    .all() as MenuRow[]

  if (menus.length === 0) return // 메뉴 데이터 없으면 스킵

  const orders: [string, ItemSpec[][]][] = [
    [
      'pending',
      [
        [{ ...pick(menus, 0), quantity: 2 }, pick(menus, 5)],
        [pick(menus, 1), { ...pick(menus, 6), quantity: 2 }],
      ],
    ],
    [
      'accepted',
      [
        [{ ...pick(menus, 2), quantity: 3 }, pick(menus, 7)],
      ],
    ],
    [
      'preparing',
      [
        [pick(menus, 0), { ...pick(menus, 3), quantity: 2 }, pick(menus, 8)],
      ],
    ],
    [
      'completed',
      [
        [{ ...pick(menus, 1), quantity: 2 }, pick(menus, 5)],
        [pick(menus, 4)],
      ],
    ],
    [
      'cancelled',
      [
        [pick(menus, 2), pick(menus, 6)],
      ],
    ],
  ]

  for (const [status, itemGroups] of orders) {
    for (const items of itemGroups) {
      createOrder(db, status, items)
    }
  }

  console.log(`✅ 오늘(${today}) 테스트 주문 7건 삽입 완료`)
}
