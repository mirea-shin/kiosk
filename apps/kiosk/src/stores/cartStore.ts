import { create } from 'zustand';
import type { MenuOption } from '@kiosk/shared';
import type { MenuWithOptions } from '../lib/api';

export interface CartItem {
  menu: MenuWithOptions;
  selectedOptions: MenuOption[];
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (menu: MenuWithOptions, selectedOptions: MenuOption[], quantity: number) => void;
  updateQuantity: (index: number, delta: number) => void;
  removeItem: (index: number) => void;
  clear: () => void;
  syncMenuData: (menus: MenuWithOptions[]) => { removedNames: string[] };
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (menu, selectedOptions, quantity) =>
    set((state) => {
      const optionKey = selectedOptions
        .map((o) => o.id)
        .sort()
        .join(',');
      const existingIndex = state.items.findIndex(
        (item) =>
          item.menu.id === menu.id &&
          item.selectedOptions
            .map((o) => o.id)
            .sort()
            .join(',') === optionKey,
      );
      if (existingIndex !== -1) {
        const items = [...state.items];
        items[existingIndex] = {
          ...items[existingIndex],
          quantity: items[existingIndex].quantity + quantity,
        };
        return { items };
      }
      return { items: [...state.items, { menu, selectedOptions, quantity }] };
    }),

  updateQuantity: (index, delta) =>
    set((state) => {
      const items = [...state.items];
      const newQty = items[index].quantity + delta;
      if (newQty <= 0) items.splice(index, 1);
      else items[index] = { ...items[index], quantity: newQty };
      return { items };
    }),

  removeItem: (index) =>
    set((state) => ({ items: state.items.filter((_, i) => i !== index) })),

  clear: () => set({ items: [] }),

  syncMenuData: (menus) => {
    const menuMap = new Map(menus.map((m) => [m.id, m]));
    const removedNames: string[] = [];
    const next = get().items
      .filter((item) => {
        const latest = menuMap.get(item.menu.id);
        if (!latest || !latest.is_available) {
          removedNames.push(item.menu.name);
          return false;
        }
        return true;
      })
      .map((item) => {
        const latest = menuMap.get(item.menu.id)!;
        const validOptionIds = new Set(latest.options?.map((o) => o.id) ?? []);
        return {
          ...item,
          menu: latest,
          selectedOptions: item.selectedOptions.filter((o) => validOptionIds.has(o.id)),
        };
      });
    set({ items: next });
    return { removedNames };
  },
}));

export function calcTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    const optPrice = item.selectedOptions.reduce((s, o) => s + o.price, 0);
    return sum + (item.menu.price + optPrice) * item.quantity;
  }, 0);
}
