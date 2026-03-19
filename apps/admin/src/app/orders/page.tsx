import type { Metadata } from 'next';
import React from 'react';

import PageHeader from '@/components/PageHeader';
import OrderList from './(components)/OrderList';

export const metadata: Metadata = {
  title: 'Orders',
  description: 'Manage incoming orders in real-time',
};

export default async function OrdersPage() {
  return (
    <div>
      <PageHeader
        title="Orders"
        description="Manage incoming orders in real-time"
      />
      <div className="p-6">
        <OrderList />
      </div>
    </div>
  );
}
