import type { Metadata } from 'next';
import React from 'react';

import type { Category, Menu } from '@kiosk/shared';
import { api } from '@/lib/api-client';
import PageHeader from '@/components/PageHeader';
import MenuManagement from './_components/MenuManagement';

export const metadata: Metadata = {
  title: '메뉴 관리',
  description: 'Manage categories and menu items',
};

const getMenus = () => api.get<Menu[]>('/api/menus', { cache: 'no-store' });
const getCategories = () => api.get<Category[]>('/api/categories', { cache: 'no-store' });

export default async function MenuPage() {
  const [menus, categories] = await Promise.all([getMenus(), getCategories()]);

  return (
    <div>
      <PageHeader
        title="메뉴 관리"
        description="메뉴와 카테고리를 한곳에서 관리하세요"
      />
      <div className="p-6">
        <MenuManagement menus={menus} categories={categories} />
      </div>
    </div>
  );
}
