import React from 'react';

import MenuList from './(components)/MenuList';

export const API_URL = 'http://localhost:3001';

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

  console.log(menus);
  console.log(categories);

  return (
    <div>
      <h2>메인 디쉬</h2>
      <MenuList menus={menus} categories={categories} />
    </div>
  );
}
