import type { BrandingConfig, Category, Menu, MenuOption, ScreensaverSyncResponse } from '@kiosk/shared';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export type MenuWithOptions = Menu & { options: MenuOption[] };

export const api = {
  categories: (): Promise<Category[]> =>
    fetch(`${API_URL}/api/categories`).then((r) => r.json()),

  menus: (categoryId?: number): Promise<MenuWithOptions[]> => {
    const url = categoryId
      ? `${API_URL}/api/menus?category_id=${categoryId}`
      : `${API_URL}/api/menus`;
    return fetch(url).then((r) => r.json());
  },

  screensaver: (): Promise<ScreensaverSyncResponse> =>
    fetch(`${API_URL}/api/screensaver`).then((r) => r.json()),

  branding: (): Promise<BrandingConfig> =>
    fetch(`${API_URL}/api/branding`).then((r) => r.json()),

  createOrder: (
    items: Array<{ menu_id: number; quantity: number; option_ids: number[] }>,
  ) =>
    fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    }).then((r) => r.json()),
};
