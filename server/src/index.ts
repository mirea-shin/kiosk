import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import Database from 'better-sqlite3'

const app = new Hono()
const db = new Database('kiosk.db')

app.get('/', (c) => {
  return c.json({ status: 'ok' })
})

serve(
  {
    fetch: app.fetch,
    port: 3001,
  },
  (info) => {
    console.log(`Server running at http://localhost:${info.port}`)
  },
)
