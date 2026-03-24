'use client';
import { useState, useEffect, useRef } from 'react';
import type { OrderStatus } from '@kiosk/shared';
import { api } from '@/lib/api-client';
import { timeAgo, formatPrice, isOrderFromToday } from '@/lib/date-utils';
import { useNotificationStore } from '@/lib/stores/notifications';
import { STATUS_CONFIG, ALL_STATUSES } from './order-config';
import type { OrderWithItems } from '@/hooks/useOrders';

export default function OrderCard({
  order,
  onStatusChange,
}: {
  order: OrderWithItems;
  onStatusChange: () => void;
}) {
  const cfg = STATUS_CONFIG[order.status];
  const orderId = `ORD-${String(order.id).padStart(3, '0')}`;
  const isEditable = isOrderFromToday(order.created_at);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const addOrMergeToast = useNotificationStore((s) => s.addOrMergeToast);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setMenuOpen(false);
    setLoading(true);
    try {
      await api.patch(`/api/orders/${order.id}/status`, { status: newStatus });
      addOrMergeToast(
        'order:status_changed',
        `${orderId} 상태가 [${STATUS_CONFIG[newStatus].label}](으)로 변경되었습니다`,
      );
      onStatusChange();
    } catch {
      addOrMergeToast('order:status_error', `${orderId} 상태 변경에 실패했습니다`);
    } finally {
      setLoading(false);
    }
  };

  const otherStatuses = ALL_STATUSES.filter((s) => s !== order.status);

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-5 flex flex-col transition-opacity ${
        loading ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-lg tracking-tight">{orderId}</span>
          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${cfg.bg} ${cfg.text}`}
          >
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => isEditable && setMenuOpen((v) => !v)}
            disabled={!isEditable}
            title={!isEditable ? '오늘 주문만 상태를 변경할 수 있습니다' : undefined}
            className={`px-1 text-base leading-none transition-colors ${
              isEditable
                ? 'text-gray-400 hover:text-gray-600 cursor-pointer'
                : 'text-gray-200 cursor-not-allowed'
            }`}
          >
            •••
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 z-20 w-44 bg-white rounded-xl border border-gray-200 shadow-lg py-1 overflow-hidden">
              <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                상태 변경
              </p>
              {otherStatuses.map((status) => {
                const s = STATUS_CONFIG[status];
                return (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 text-left"
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                    <span className={s.text}>{s.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Time */}
      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1 mb-5">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {timeAgo(order.created_at)}
      </div>

      {/* Items */}
      <div className="space-y-2">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-gray-500">
              <span className="font-semibold text-gray-800">{item.quantity}x</span>{' '}
              {item.menu_name}
            </span>
            <span className="text-gray-800 font-medium">
              {formatPrice(item.unit_price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="border-t border-gray-200 mt-4 pt-3 flex justify-between items-center">
        <span className="font-semibold text-gray-800">합계</span>
        <span className="font-bold text-green-600 text-base">
          {formatPrice(order.total_price)}
        </span>
      </div>
    </div>
  );
}
