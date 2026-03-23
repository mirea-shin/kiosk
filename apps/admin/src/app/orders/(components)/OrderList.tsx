'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_URL } from '@/lib/api';
import { Order, OrderItem, OrderStatus } from '@kiosk/shared';
import {
  addRefreshSubscriber,
  removeRefreshSubscriber,
} from '@/lib/websocket-manager';
import { useNotificationStore } from '@/lib/stores/notifications';
import EmptyState from '@/components/EmptyState';
import { ShoppingCart } from 'lucide-react';

type OrderWithItems = Order & { items: OrderItem[] };

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; dot: string; bg: string; text: string }
> = {
  pending: {
    label: '대기중',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
  },
  accepted: {
    label: '접수',
    dot: 'bg-blue-500',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
  },
  preparing: {
    label: '준비중',
    dot: 'bg-teal-500',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
  },
  completed: {
    label: '완료',
    dot: 'bg-green-500',
    bg: 'bg-green-50',
    text: 'text-green-700',
  },
  cancelled: {
    label: '취소',
    dot: 'bg-red-400',
    bg: 'bg-red-50',
    text: 'text-red-500',
  },
};

const STATUS_TABS: { label: string; value: OrderStatus | undefined }[] = [
  { label: '전체', value: undefined },
  ...(Object.entries(STATUS_CONFIG) as [OrderStatus, (typeof STATUS_CONFIG)[OrderStatus]][]).map(
    ([value, cfg]) => ({ label: cfg.label, value }),
  ),
];

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as OrderStatus[];

// ── 유틸 ──────────────────────────────────────────────

function todayKSTDate(): string {
  // 한국 시간(KST, UTC+9) 기준 오늘 날짜
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function isOrderFromToday(createdAt: string): boolean {
  // SQLite UTC 시간을 KST로 변환 후 오늘 날짜와 비교
  const utc = new Date(createdAt.replace(' ', 'T') + 'Z');
  const kst = new Date(utc.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10) === todayKSTDate();
}

function timeAgo(dateStr: string): string {
  // SQLite datetime('now')는 UTC를 'YYYY-MM-DD HH:MM:SS' 형식으로 반환
  // new Date()는 T/Z 없으면 로컬 시간으로 파싱하므로 명시적으로 UTC 변환
  const diff = Math.floor((Date.now() - new Date(dateStr.replace(' ', 'T') + 'Z').getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
}

function formatPrice(price: number): string {
  return `₩${price.toLocaleString()}`;
}

// ── OrderCard ─────────────────────────────────────────

function OrderCard({
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
      const res = await fetch(`${API_URL}/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
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
        <svg
          className="w-3.5 h-3.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
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

// ── OrderList ─────────────────────────────────────────

export default function OrderList() {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | undefined>(undefined);
  const [dateMode, setDateMode] = useState<'today' | 'all'>('today');
  const [allOrders, setAllOrders] = useState<OrderWithItems[]>([]);

  const fetchOrders = useCallback(() => {
    const params = new URLSearchParams();
    if (dateMode === 'today') params.set('date', todayKSTDate());
    fetch(`${API_URL}/api/orders?${params}`)
      .then((res) => res.json())
      .then(setAllOrders);
  }, [dateMode]);

  useEffect(() => {
    fetchOrders();
    addRefreshSubscriber(fetchOrders);
    return () => removeRefreshSubscriber(fetchOrders);
  }, [fetchOrders]);

  const displayed =
    selectedStatus === undefined
      ? allOrders
      : allOrders.filter((o) => o.status === selectedStatus);

  const tabCount = (value: OrderStatus | undefined) =>
    value === undefined
      ? allOrders.length
      : allOrders.filter((o) => o.status === value).length;

  return (
    <div>
      {/* Top bar: status tabs + date toggle */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        {/* Status filter — mobile: select / desktop: button group */}
        <select
          value={selectedStatus ?? ''}
          onChange={(e) =>
            setSelectedStatus(e.target.value === '' ? undefined : (e.target.value as OrderStatus))
          }
          className="sm:hidden rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700"
        >
          {STATUS_TABS.map((tab) => (
            <option key={tab.label} value={tab.value ?? ''}>
              {tab.label} ({tabCount(tab.value)})
            </option>
          ))}
        </select>
        <div className="hidden sm:flex items-center gap-2 flex-wrap">
          {STATUS_TABS.map((tab) => {
            const isActive = selectedStatus === tab.value;
            return (
              <button
                key={tab.label}
                onClick={() => setSelectedStatus(tab.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`inline-flex items-center justify-center min-w-6 h-5 px-1 rounded-full text-xs tabular-nums ${
                    isActive ? 'bg-green-500 text-green-100' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {tabCount(tab.value)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Date mode toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 shrink-0">
          <button
            onClick={() => setDateMode('today')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              dateMode === 'today'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            오늘
          </button>
          <button
            onClick={() => setDateMode('all')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              dateMode === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            전체
          </button>
        </div>
      </div>

      {/* Order cards grid */}
      {displayed.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart size={28} />}
          title={selectedStatus !== undefined ? `${STATUS_CONFIG[selectedStatus].label} 주문이 없습니다` : dateMode === 'today' ? '오늘 접수된 주문이 없습니다' : '주문이 없습니다'}
          description={dateMode === 'today' ? '새 주문이 들어오면 여기에 표시됩니다.' : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((order) => (
            <OrderCard key={order.id} order={order} onStatusChange={fetchOrders} />
          ))}
        </div>
      )}
    </div>
  );
}
