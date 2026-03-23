import type { Metadata } from 'next';
import React from 'react';

import PageHeader from '@/components/PageHeader';
import OrderList from './(components)/OrderList';

export const metadata: Metadata = {
  title: '주문 관리',
  description: 'Manage incoming orders in real-time',
};

export default async function OrdersPage() {
  return (
    <div>
      <PageHeader
        title="주문 관리"
        description="주문을 실시간으로 확인하고 관리하세요"
      />
      <div className="p-6">
        <OrderList />
      </div>
    </div>
  );
}
