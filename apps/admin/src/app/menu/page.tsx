import type { Metadata } from 'next';
import React from 'react';

import PageHeader from '@/components/PageHeader';
import MenuList from './(components)/MenuList';
import CategoryList from './(components)/CategoryList';

import { API_URL } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Menu',
  description: 'Manage menu items and categories',
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
        title="Menu"
        description="Manage menu items and categories"
      />
      <div className="p-6">
        <div>
          <CategoryList categories={categories} />
        </div>
        <MenuList menus={menus} categories={categories} />
      </div>
    </div>
  );
}
