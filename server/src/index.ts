import { serve } from '@hono/node-server'
import { createNodeWebSocket } from '@hono/node-ws'
import { mkdir } from 'fs/promises'
import { join } from 'path'
import { db, initSchema } from './db.js'
import { wsManager } from './ws-manager.js'
import { createApp } from './app.js'
import { seedDailyOrders } from './seed-daily.js'

await mkdir(join(process.cwd(), 'uploads', 'screensaver'), { recursive: true })

initSchema(db)
seedDailyOrders(db)

const app = createApp(db, wsManager)
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })

// Register WebSocket route after upgradeWebSocket is available
app.get(
  '/ws',
  upgradeWebSocket(() => ({
    onOpen(_event, ws) {
      wsManager.add(ws)
    },
    onClose(_event, ws) {
      wsManager.remove(ws)
    },
  })),
)

const server = serve(
  {
    fetch: app.fetch,
    port: 3001,
  },
  (info) => {
    console.log(`Server running at http://localhost:${info.port}`)
  },
)

injectWebSocket(server)
