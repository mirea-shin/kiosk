import React from 'react';

import MenuList from './(components)/MenuList';
import CategoryList from './(components)/CategoryList';

import { API_URL } from '@/lib/api';
export { API_URL };

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
      <h2>메인 디쉬</h2>
      <div>
        <CategoryList categories={categories} />
      </div>
      <MenuList menus={menus} categories={categories} />
    </div>
  );
}
