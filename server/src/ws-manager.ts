import type { WSContext } from 'hono/ws'

const clients = new Set<WSContext>()

export const wsManager = {
  add(ws: WSContext) {
    clients.add(ws)
  },
  remove(ws: WSContext) {
    clients.delete(ws)
  },
  broadcast(event: string, data: unknown) {
    const msg = JSON.stringify({ event, data })
    clients.forEach(ws => {
      if (ws.readyState === 1) ws.send(msg)
    })
  },
}

export type WsManager = typeof wsManager
