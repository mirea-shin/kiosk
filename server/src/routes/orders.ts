import { Hono } from 'hono';
import type Database from 'better-sqlite3';
import type { Order, OrderItem, MenuOption, OrderStatus } from '@kiosk/shared';
import type { WsManager } from '../ws-manager.js';

// DB row: status는 string으로 반환됨
type OrderRow = Omit<Order, 'status'> & { status: string };
type OrderItemRow = Omit<OrderItem, 'options'>;

function attachItems(
  db: Database.Database,
  orders: OrderRow[],
): (Order & { items: OrderItem[] })[] {
  return orders.map((order) => {
    const items = db
      .prepare('SELECT * FROM order_items WHERE order_id = ?')
      .all(order.id) as OrderItemRow[];
    const itemsWithOptions: OrderItem[] = items.map((item) => {
      const options = db
        .prepare(
          `SELECT mo.id, mo.name, mo.price, mo.menu_id
           FROM order_item_options oio
           JOIN menu_options mo ON mo.id = oio.menu_option_id
           WHERE oio.order_item_id = ?`,
        )
        .all(item.id) as MenuOption[];
      return { ...item, options };
    });
    return {
      ...order,
      status: order.status as OrderStatus,
      items: itemsWithOptions,
    };
  });
}

export function ordersRouter(db: Database.Database, ws: WsManager) {
  const app = new Hono();

  app.get('/', (c) => {
    const status = c.req.query('status');
    const date = c.req.query('date'); // YYYY-MM-DD

    const conditions: string[] = [];
    const params: string[] = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (date) {
      conditions.push("date(created_at) = ?");
      params.push(date);
    }

    const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
    const orders = db
      .prepare(`SELECT * FROM orders${where} ORDER BY created_at DESC`)
      .all(...params) as OrderRow[];

    return c.json(attachItems(db, orders));
  });

  app.get('/:id', (c) => {
    const id = Number(c.req.param('id'));
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as
      | OrderRow
      | undefined;
    if (!order) return c.json({ error: 'Not found' }, 404);
    const [withItems] = attachItems(db, [order]);
    return c.json(withItems);
  });

  app.post('/', async (c) => {
    const body = await c.req.json<{
      items: Array<{
        menu_id: number;
        quantity: number;
        option_ids?: number[];
      }>;
    }>();
    if (!body.items || body.items.length === 0) {
      return c.json({ error: 'items are required' }, 400);
    }

    const createOrder = db.transaction(() => {
      let totalPrice = 0;

      for (const item of body.items) {
        const menu = db
          .prepare('SELECT id, price FROM menus WHERE id = ?')
          .get(item.menu_id) as { id: number; price: number } | undefined;
        if (!menu) throw new Error(`Menu ${item.menu_id} not found`);

        let itemPrice = menu.price;
        for (const optionId of item.option_ids ?? []) {
          const option = db
            .prepare(
              'SELECT price FROM menu_options WHERE id = ? AND menu_id = ?',
            )
            .get(optionId, item.menu_id) as { price: number } | undefined;
          if (!option) throw new Error(`Option ${optionId} not found`);
          itemPrice += option.price;
        }
        totalPrice += itemPrice * item.quantity;
      }

      const orderResult = db
        .prepare('INSERT INTO orders (total_price) VALUES (?)')
        .run(totalPrice);
      const orderId = orderResult.lastInsertRowid;

      for (const item of body.items) {
        const menu = db
          .prepare('SELECT id, name, price FROM menus WHERE id = ?')
          .get(item.menu_id) as { id: number; name: string; price: number };

        let unitPrice = menu.price;
        for (const optionId of item.option_ids ?? []) {
          const option = db
            .prepare('SELECT price FROM menu_options WHERE id = ?')
            .get(optionId) as { price: number };
          unitPrice += option.price;
        }

        const itemResult = db
          .prepare(
            'INSERT INTO order_items (order_id, menu_id, menu_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)',
          )
          .run(orderId, item.menu_id, menu.name, item.quantity, unitPrice);

        for (const optionId of item.option_ids ?? []) {
          db.prepare(
            'INSERT INTO order_item_options (order_item_id, menu_option_id) VALUES (?, ?)',
          ).run(itemResult.lastInsertRowid, optionId);
        }
      }

      return db
        .prepare('SELECT * FROM orders WHERE id = ?')
        .get(orderId) as OrderRow;
    });

    try {
      const order = createOrder();
      const [withItems] = attachItems(db, [order]);
      ws.broadcast('order:created', withItems);
      return c.json(withItems, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: message }, 400);
    }
  });

  app.patch('/:id/status', async (c) => {
    const id = Number(c.req.param('id'));
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as
      | OrderRow
      | undefined;
    if (!order) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json<{ status: OrderStatus }>();
    const validStatuses: OrderStatus[] = [
      'pending',
      'accepted',
      'preparing',
      'completed',
      'cancelled',
    ];
    if (!validStatuses.includes(body.status)) {
      return c.json({ error: 'Invalid status' }, 400);
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(
      body.status,
      id,
    );
    const updated = db
      .prepare('SELECT * FROM orders WHERE id = ?')
      .get(id) as OrderRow;
    const [withItems] = attachItems(db, [updated]);
    ws.broadcast('order:status_changed', withItems);
    return c.json(withItems);
  });

  return app;
}
