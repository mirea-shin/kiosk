# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dev Commands

```bash
# Run each app independently
pnpm kiosk:dev    # Electron kiosk app (renderer + main process + electron)
pnpm admin:dev    # Next.js admin dashboard
pnpm server:dev   # Hono API server (tsx watch)

# Filter commands for specific packages
pnpm --filter @kiosk/kiosk build
pnpm --filter @kiosk/admin build
pnpm --filter @kiosk/server build

# Package Electron app for distribution
pnpm --filter @kiosk/kiosk package
```

## Architecture

pnpm monorepo with three apps and a shared types package:

- **`apps/kiosk/`** — Electron (v34) + React 19 + Vite + Zustand + React Query. Customer-facing kiosk UI at 1080×1920px. Renderer runs on port 5800 during dev.
- **`apps/admin/`** — Next.js 15 + React 19. Management dashboard.
- **`server/`** — Hono + better-sqlite3. REST API on port 3001, ES modules, SQLite file `kiosk.db`.
- **`packages/shared/`** — TypeScript types only (no build step). Domain models: `Category`, `Menu`, `MenuOption`, `Order`, `OrderItem`, `OrderStatus`, `ScreensaverConfig`.

## Kiosk Electron Build

The kiosk app has two separate TypeScript compilation targets:

| Config | Target | Module | Output |
|--------|--------|--------|--------|
| `tsconfig.json` | DOM (renderer) | ESNext/bundler | Vite output → `dist/renderer/` |
| `tsconfig.node.json` | Node (electron) | CommonJS | `dist/electron/` |

`dev` script runs three concurrent processes: `dev:renderer` (Vite), `dev:main` (tsc watch on `tsconfig.node.json`), and `dev:electron` (waits for both via `wait-on`).

## Electron IPC Pattern

Security model uses `contextIsolation: true` + preload bridge. To add new IPC channels:

1. **`electron/main.ts`** — add `ipcMain.handle('channel-name', handler)`
2. **`electron/preload.ts`** — expose via `contextBridge.exposeInMainWorld('electronAPI', { ... })`
3. **`src/electron.d.ts`** — extend `Window.electronAPI` interface

Renderer calls: `window.electronAPI.methodName(args)`

## @kiosk/shared Import Resolution

Each app resolves the shared package through three layers (all must be consistent):

1. `package.json`: `"@kiosk/shared": "workspace:*"`
2. `tsconfig paths`: `"@kiosk/shared": ["../../packages/shared/src/types.ts"]`
3. Vite alias (kiosk only) or `next.config.ts` `transpilePackages` (admin)

## Tailwind v4

- **kiosk**: `@tailwindcss/vite` plugin in `vite.config.ts`, CSS entry: `@import "tailwindcss"`
- **admin**: `@tailwindcss/postcss` in `postcss.config.mjs`, CSS entry: `@import "tailwindcss"`
