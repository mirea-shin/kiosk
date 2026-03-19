'use client';

import { Menu } from 'lucide-react';
import { useSidebarStore } from '@/lib/stores/sidebar';

export default function MobileHeader() {
  const toggle = useSidebarStore((s) => s.toggle);

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-sm font-bold text-white">
          K
        </div>
        <span className="font-semibold text-gray-900">Kiosk Admin</span>
      </div>
      <button
        onClick={toggle}
        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        aria-label="메뉴 열기"
      >
        <Menu size={20} />
      </button>
    </header>
  );
}
