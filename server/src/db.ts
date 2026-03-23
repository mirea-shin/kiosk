import Database from 'better-sqlite3'

export function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS menus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price INTEGER NOT NULL,
      image_url TEXT,
      is_available INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS menu_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      price INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending','accepted','preparing','completed','cancelled')),
      total_price INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_id INTEGER NOT NULL,
      menu_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_item_options (
      order_item_id  INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
      menu_option_id INTEGER NOT NULL REFERENCES menu_options(id) ON DELETE CASCADE,
      PRIMARY KEY (order_item_id, menu_option_id)
    );

    CREATE TABLE IF NOT EXISTS screensaver_config (
      id INTEGER PRIMARY KEY DEFAULT 1 CHECK(id = 1),
      idle_timeout_seconds INTEGER NOT NULL DEFAULT 60,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT OR IGNORE INTO screensaver_config(id) VALUES(1);

    CREATE TABLE IF NOT EXISTS screensaver_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      original_name TEXT NOT NULL,
      file_type TEXT NOT NULL CHECK(file_type IN ('image', 'video')),
      file_size INTEGER NOT NULL,
      display_duration_seconds INTEGER NOT NULL DEFAULT 5,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS branding_config (
      id            INTEGER PRIMARY KEY DEFAULT 1 CHECK(id = 1),
      primary_color TEXT NOT NULL DEFAULT '#f97316',
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT OR IGNORE INTO branding_config(id) VALUES(1);

    CREATE TABLE IF NOT EXISTS screensaver_changelog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      is_published INTEGER NOT NULL DEFAULT 0
    );
  `)

  // 기존 DB 마이그레이션: screensaver_config에 타임스탬프 컬럼 추가
  for (const sql of [
    `ALTER TABLE screensaver_config ADD COLUMN last_modified_at TEXT`,
    `ALTER TABLE screensaver_config ADD COLUMN last_published_at TEXT`,
  ]) {
    try { db.exec(sql) } catch { /* 이미 존재하면 무시 */ }
  }

  // order_item_options 마이그레이션: menu_option_id에 ON DELETE CASCADE 추가
  // SQLite는 ALTER TABLE ADD CONSTRAINT 미지원 → 테이블 재생성
  const hasOldTable = db.prepare(
    `SELECT sql FROM sqlite_master WHERE type='table' AND name='order_item_options'`
  ).get() as { sql: string } | undefined

  if (hasOldTable && !hasOldTable.sql.includes('ON DELETE CASCADE')) {
    db.pragma('foreign_keys = OFF')
    db.exec(`
      CREATE TABLE order_item_options_new (
        order_item_id  INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
        menu_option_id INTEGER NOT NULL REFERENCES menu_options(id) ON DELETE CASCADE,
        PRIMARY KEY (order_item_id, menu_option_id)
      );
      INSERT OR IGNORE INTO order_item_options_new SELECT * FROM order_item_options;
      DROP TABLE order_item_options;
      ALTER TABLE order_item_options_new RENAME TO order_item_options;
    `)
    db.pragma('foreign_keys = ON')
  }
}

export const db = new Database('kiosk.db')
db.pragma('foreign_keys = ON')
