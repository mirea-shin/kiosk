import { serve } from '@hono/node-server'
import { createNodeWebSocket } from '@hono/node-ws'
import { db, initSchema } from './db.js'
import { wsManager } from './ws-manager.js'
import { createApp } from './app.js'

initSchema(db)

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
