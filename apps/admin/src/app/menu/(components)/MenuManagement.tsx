'use client';
import React, { useState, useEffect } from 'react';
import type { Category, Menu } from '@kiosk/shared';
import CategoryList from './CategoryList';
import MenuList from './MenuList';

export default function MenuManagement({
  menus,
  categories,
}: {
  menus: Menu[];
  categories: Category[];
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(
    categories[0]?.id ?? 0,
  );

  // 선택된 카테고리가 삭제됐을 때 첫 번째 카테고리로 fallback
  useEffect(() => {
    const stillExists = categories.some((c) => c.id === selectedCategoryId);
    if (!stillExists && categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories]);

  const filteredMenus = menus.filter((m) => m.category_id === selectedCategoryId);
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div>
      <CategoryList
        categories={categories}
        menus={menus}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
      />
      {selectedCategory && (
        <MenuList
          menus={filteredMenus}
          categories={categories}
          selectedCategory={selectedCategory}
        />
      )}
    </div>
  );
}
