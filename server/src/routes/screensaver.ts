import { Hono } from 'hono';
import { randomUUID } from 'crypto';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import type Database from 'better-sqlite3';
import type { ScreensaverConfig, ScreensaverMedia } from '@kiosk/shared';

const UPLOADS_DIR = join(process.cwd(), 'uploads', 'screensaver');
const ALLOWED_MIME: Record<string, 'image' | 'video'> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/quicktime': 'video',
};

function toMediaResponse(
  row: Omit<ScreensaverMedia, 'url'>,
  baseUrl: string,
): ScreensaverMedia {
  return { ...row, url: `${baseUrl}/uploads/screensaver/${row.filename}` };
}

function getBaseUrl(c: { req: { url: string } }): string {
  const url = new URL(c.req.url);
  return `${url.protocol}//${url.host}`;
}

export function screensaverRouter(db: Database.Database) {
  const app = new Hono();

  // GET /api/screensaver — config + media list (키오스크 sync용)
  app.get('/', (c) => {
    const config = db
      .prepare('SELECT * FROM screensaver_config WHERE id = 1')
      .get() as ScreensaverConfig;

    const mediaRows = db
      .prepare(
        'SELECT * FROM screensaver_media ORDER BY sort_order ASC, id ASC',
      )
      .all() as Omit<ScreensaverMedia, 'url'>[];

    const baseUrl = getBaseUrl(c);

    return c.json({
      idle_timeout_seconds: config.idle_timeout_seconds,
      media: mediaRows.map((row) => toMediaResponse(row, baseUrl)),
    });
  });

  // PUT /api/screensaver — idle_timeout_seconds 수정
  app.put('/', async (c) => {
    const body =
      await c.req.json<Pick<ScreensaverConfig, 'idle_timeout_seconds'>>();
    if (body.idle_timeout_seconds == null) {
      return c.json({ error: 'idle_timeout_seconds is required' }, 400);
    }
    db.prepare(
      "UPDATE screensaver_config SET idle_timeout_seconds = ?, updated_at = datetime('now') WHERE id = 1",
    ).run(body.idle_timeout_seconds);
    const config = db
      .prepare('SELECT * FROM screensaver_config WHERE id = 1')
      .get() as ScreensaverConfig;
    return c.json(config);
  });

  // POST /api/screensaver/media — 파일 업로드 (multipart/form-data)
  app.post('/media', async (c) => {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return c.json({ error: 'file is required' }, 400);
    }

    const fileType = ALLOWED_MIME[file.type];
    if (!fileType) {
      return c.json({ error: `Unsupported file type: ${file.type}` }, 400);
    }

    const ext = file.name.split('.').pop() ?? '';
    const filename = `${randomUUID()}.${ext}`;
    const filePath = join(UPLOADS_DIR, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const maxSortOrder = (
      db
        .prepare('SELECT MAX(sort_order) as max FROM screensaver_media')
        .get() as { max: number | null }
    ).max;
    const nextSortOrder = (maxSortOrder ?? -1) + 1;

    const result = db
      .prepare(
        `INSERT INTO screensaver_media (filename, original_name, file_type, file_size, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(filename, file.name, fileType, file.size, nextSortOrder);

    const row = db
      .prepare('SELECT * FROM screensaver_media WHERE id = ?')
      .get(result.lastInsertRowid) as Omit<ScreensaverMedia, 'url'>;

    return c.json(toMediaResponse(row, getBaseUrl(c)), 201);
  });

  // PATCH /api/screensaver/media/:id — display_duration_seconds 수정
  app.patch('/media/:id', async (c) => {
    const id = Number(c.req.param('id'));
    const body = await c.req.json<{ display_duration_seconds: number }>();
    if (body.display_duration_seconds == null) {
      return c.json({ error: 'display_duration_seconds is required' }, 400);
    }
    const updated = db
      .prepare(
        'UPDATE screensaver_media SET display_duration_seconds = ? WHERE id = ?',
      )
      .run(body.display_duration_seconds, id);
    if (updated.changes === 0) {
      return c.json({ error: 'Not found' }, 404);
    }
    const row = db
      .prepare('SELECT * FROM screensaver_media WHERE id = ?')
      .get(id) as Omit<ScreensaverMedia, 'url'>;
    return c.json(toMediaResponse(row, getBaseUrl(c)));
  });

  // PUT /api/screensaver/media/reorder — 재생 순서 저장
  app.put('/media/reorder', async (c) => {
    const body = await c.req.json<{ orders: { id: number; sort_order: number }[] }>();
    if (!Array.isArray(body.orders)) {
      return c.json({ error: 'orders array is required' }, 400);
    }
    const update = db.prepare(
      'UPDATE screensaver_media SET sort_order = ? WHERE id = ?',
    );
    const txn = db.transaction(() => {
      for (const { id, sort_order } of body.orders) {
        update.run(sort_order, id);
      }
    });
    txn();
    return c.json({ ok: true });
  });

  // DELETE /api/screensaver/media/:id — DB + 디스크에서 삭제
  app.delete('/media/:id', async (c) => {
    const id = Number(c.req.param('id'));
    const row = db
      .prepare('SELECT * FROM screensaver_media WHERE id = ?')
      .get(id) as Omit<ScreensaverMedia, 'url'> | undefined;
    if (!row) {
      return c.json({ error: 'Not found' }, 404);
    }
    db.prepare('DELETE FROM screensaver_media WHERE id = ?').run(id);
    const filePath = join(UPLOADS_DIR, row.filename);
    await unlink(filePath).catch(() => {
      // 파일이 이미 없어도 무시
    });
    return c.json({ ok: true });
  });

  return app;
}
