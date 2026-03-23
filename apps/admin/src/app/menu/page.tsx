import type { Metadata } from 'next';
import React from 'react';

import PageHeader from '@/components/PageHeader';
import MenuManagement from './(components)/MenuManagement';

import { API_URL } from '@/lib/api';

export const metadata: Metadata = {
  title: '메뉴 관리',
  description: 'Manage categories and menu items',
};

const getMenus = async () => {
  const response = await fetch(`${API_URL}/api/menus`);
  const data = await response.json();
  return data;
};

const getCategories = async () => {
  const response = await fetch(`${API_URL}/api/categories`);
  const data = await response.json();
  return data;
};

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
