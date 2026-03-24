'use client';
import { useState } from 'react';
import type { OrderStatus } from '@kiosk/shared';
import { ShoppingCart } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { STATUS_CONFIG } from './order-config';
import OrderCard from './OrderCard';
import OrderFilters from './OrderFilters';
import EmptyState from '@/components/EmptyState';

export default function OrderList() {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | undefined>(undefined);
  const [dateMode, setDateMode] = useState<'today' | 'all'>('today');
  const { orders, refetch } = useOrders(dateMode);

  const displayed =
    selectedStatus === undefined
      ? orders
      : orders.filter((o) => o.status === selectedStatus);

  const countByStatus = (value: OrderStatus | undefined) =>
    value === undefined ? orders.length : orders.filter((o) => o.status === value).length;

  return (
    <div>
      <OrderFilters
        selectedStatus={selectedStatus}
        dateMode={dateMode}
        countByStatus={countByStatus}
        onStatusChange={setSelectedStatus}
        onDateModeChange={setDateMode}
      />

      {displayed.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart size={28} />}
          title={
            selectedStatus !== undefined
              ? `${STATUS_CONFIG[selectedStatus].label} 주문이 없습니다`
              : dateMode === 'today'
                ? '오늘 접수된 주문이 없습니다'
                : '주문이 없습니다'
          }
          description={
            dateMode === 'today' ? '새 주문이 들어오면 여기에 표시됩니다.' : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((order) => (
            <OrderCard key={order.id} order={order} onStatusChange={refetch} />
          ))}
        </div>
      )}
    </div>
  );
}
