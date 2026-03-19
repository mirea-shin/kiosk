'use client';
import React, { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';
import { Order } from '@kiosk/shared';

// 전체 조회.. 체크박스260118
const ORDER_STATUS = [
  'pending',
  'accepted',
  'preparing',
  'completed',
  'cancelled',
];

export default function OrderList() {
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(
    undefined,
  );
  const [orders, setOrders] = useState<Order[]>([]);

  const getOrders = () =>
    fetch(`${API_URL}/api/orders?status=${selectedStatus || ''}`)
      .then((res) => res.json())
      .then((data) => setOrders(data));

  useEffect(() => {
    getOrders();
  }, [selectedStatus]);

  const handleOrderStatus = (id: number) => {
    fetch(`${API_URL}/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
      .then((res) => res.json())
      .then((data) => {
        getOrders();
      });
  };

  return (
    <div>
      <div>
        {ORDER_STATUS.map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`${selectedStatus === status ? 'bg-red-100' : ''}`}
          >
            {status}
          </button>
        ))}

        {orders?.map((o) => (
          <div key={o.id} className="border">
            {' '}
            <span>{o.total_price}</span>
            <button onClick={() => handleOrderStatus(o.id)}>{o.status}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
