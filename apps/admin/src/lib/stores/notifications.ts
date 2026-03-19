import { create } from 'zustand';

export interface Toast {
  id: string;
  event: string;
  message: string;
  count: number;
  updatedAt: number;
}

interface NotificationStore {
  toasts: Toast[];
  unreadCount: number;
  addOrMergeToast: (event: string, message: string) => void;
  dismissToast: (id: string) => void;
  markRead: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  toasts: [],
  unreadCount: 0,

  addOrMergeToast: (event, message) =>
    set((state) => {
      const existing = state.toasts.find((t) => t.event === event);

      if (existing) {
        return {
          toasts: state.toasts.map((t) =>
            t.id === existing.id
              ? { ...t, count: t.count + 1, updatedAt: Date.now() }
              : t,
          ),
          unreadCount: state.unreadCount + 1,
        };
      }

      return {
        toasts: [
          ...state.toasts,
          {
            id: crypto.randomUUID(),
            event,
            message,
            count: 1,
            updatedAt: Date.now(),
          },
        ],
        unreadCount: state.unreadCount + 1,
      };
    }),

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  markRead: () => set({ unreadCount: 0 }),
}));
