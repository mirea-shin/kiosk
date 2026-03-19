'use client';

import { useEffect } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { useNotificationStore, type Toast } from '@/lib/stores/notifications';

const AUTO_DISMISS_MS = 5000;

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  // updatedAt이 바뀔 때마다(메시지 병합 시) 타이머 리셋
  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.updatedAt, onDismiss]);

  return (
    <div className="flex min-w-72 items-center gap-3 rounded-lg bg-gray-900 px-4 py-3 text-white shadow-lg">
      <ShoppingBag size={16} className="shrink-0 text-green-400" />
      <span className="flex-1 text-sm">
        {toast.count > 1 ? `새 주문 ${toast.count}건이 들어왔습니다` : toast.message}
      </span>
      <button
        onClick={onDismiss}
        className="text-gray-400 hover:text-white"
        aria-label="알림 닫기"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, dismissToast } = useNotificationStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => dismissToast(toast.id)}
        />
      ))}
    </div>
  );
}
