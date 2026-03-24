'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Order, OrderItem } from '@kiosk/shared';
import { api } from '@/lib/api-client';
import { todayKSTDate } from '@/lib/date-utils';
import { addRefreshSubscriber, removeRefreshSubscriber } from '@/lib/websocket-manager';

export type OrderWithItems = Order & { items: OrderItem[] };

/**
 * 주문 목록을 가져오고 WebSocket 새로고침 이벤트를 구독합니다.
 * dateMode가 변경되면 자동으로 재요청합니다.
 */
export function useOrders(dateMode: 'today' | 'all') {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);

  const fetchOrders = useCallback(async () => {
    const params = new URLSearchParams();
    if (dateMode === 'today') params.set('date', todayKSTDate());
    try {
      const data = await api.get<OrderWithItems[]>(`/api/orders?${params}`);
      setOrders(data);
    } catch {
      // 네트워크 오류 시 기존 데이터 유지 (silent fail)
    }
  }, [dateMode]);

  useEffect(() => {
    fetchOrders();
    addRefreshSubscriber(fetchOrders);
    return () => removeRefreshSubscriber(fetchOrders);
  }, [fetchOrders]);

  return { orders, refetch: fetchOrders };
}
