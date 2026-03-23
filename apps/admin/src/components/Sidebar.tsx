'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ClipboardList, UtensilsCrossed, Monitor, Palette, RotateCcw, X } from 'lucide-react';
import { useSidebarStore } from '@/lib/stores/sidebar';
import { useNotificationStore } from '@/lib/stores/notifications';
import ConfirmDialog from '@/components/ConfirmDialog';
import { API_URL } from '@/lib/api';

const navItems = [
  { href: '/orders', label: '주문관리', icon: ClipboardList },
  { href: '/menu', label: '메뉴관리', icon: UtensilsCrossed },
  { href: '/screensaver', label: '화면관리', icon: Monitor },
  { href: '/branding', label: '색상관리', icon: Palette },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { unreadCount, markRead } = useNotificationStore();
  const [showRefreshConfirm, setShowRefreshConfirm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_URL}/api/demo/refresh`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('[demo/refresh] 실패:', data);
        return;
      }
      router.refresh();
    } finally {
      setRefreshing(false);
      setShowRefreshConfirm(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 text-sm font-bold text-white">
            K
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Kiosk Admin</p>
            <p className="text-xs text-gray-500">Restaurant Dashboard</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => {
                if (href === '/orders') markRead();
                onClose?.();
              }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon
                size={18}
                className={active ? 'text-green-600' : 'text-gray-400'}
              />
              <span className="flex-1">{label}</span>
              {href === '/orders' && unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-green-600 px-1 text-xs font-medium text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
        <p className="text-xs text-gray-400">v1.0.0</p>
        <button
          onClick={() => setShowRefreshConfirm(true)}
          disabled={refreshing}
          title="데모 초기화"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 transition-colors"
        >
          <RotateCcw size={13} className={refreshing ? 'animate-spin' : ''} />
          초기화
        </button>
      </div>

      <ConfirmDialog
        isOpen={showRefreshConfirm}
        title="데모 초기화"
        description={
          <ul className="mt-1 space-y-1 text-left text-xs text-gray-500">
            <li>• 메뉴 · 카테고리 → 기본 씨드로 복원</li>
            <li>• 브랜드 색상 → 기본값으로</li>
            <li>• 스크린세이버 미디어 전체 삭제</li>
            <li className="text-gray-400">• 주문 내역은 유지됩니다</li>
          </ul>
        }
        confirmLabel="초기화"
        variant="danger"
        onConfirm={handleRefresh}
        onCancel={() => setShowRefreshConfirm(false)}
      />
    </div>
  );
}

export default function Sidebar() {
  const { isOpen, close } = useSidebarStore();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={close}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl lg:hidden">
            <SidebarContent onClose={close} />
          </aside>
        </>
      )}
    </>
  );
}
