'use client';
import { useState } from 'react';
import { Category } from '@kiosk/shared';
import React from 'react';
import { API_URL } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function CategoryList({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();

  const [showCategoryAddForm, setShowCategoryAddForm] = useState(false);
  const [showCategoryManageModal, setShowCategoryManageModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    Category | undefined
  >();

  const closeCategoryModal = () => {
    initFormData();
    setSelectedCategory(undefined);
    setShowCategoryManageModal(false);
  };

  const initFormData = () => {
    setCategoryName('');
    setShowCategoryAddForm(false);
  };

  const addCategory = async (categoryName: string) => {
    const response = await fetch(`${API_URL}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: categoryName }),
    });
    return response;
  };

  const updateCategory = async (
    formData: {
      name: string;
      sort_order: number;
    },
    id: number,
  ) => {
    const response = await fetch(`${API_URL}/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    return response;
  };

  const deleteCategory = async (id: number) => {
    const confirmedDelete = window.confirm(
      '카테고리를 삭제하시겠습니까? 내부 데이터는 삭제됩니다.',
    );
    if (!confirmedDelete) return;
    const response = await fetch(`${API_URL}/api/categories/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();

    if (result.success) {
      router.refresh();
    }
  };

  const handleAddCatergory = () => {
    setShowCategoryAddForm(true);
  };

  const handleSubmitCategory = async (
    e: React.SubmitEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    if (!categoryName) return;

    if (selectedCategory) {
      const result = await updateCategory(
        {
          name: categoryName,
          sort_order: selectedCategory.sort_order,
        },
        selectedCategory.id,
      );
      if (result.ok) {
        closeCategoryModal();
        router.refresh();
      }
    } else {
      const result = await addCategory(categoryName);
      if (result.ok) {
        initFormData();
        router.refresh();
      }
    }
  };

  const handleManageCatergory = () => {
    setShowCategoryManageModal(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement, HTMLInputElement>,
  ) => {
    const { value } = e.target;

    setCategoryName(value);
  };

  return (
    <div className="flex justify-between">
      {showCategoryAddForm && (
        <div className="absolute bg-red-200 z-50">
          <header className="flex justify-between">
            <h2>카테고리 {selectedCategory ? `수정` : '추가'}</h2>
            <button onClick={closeCategoryModal}>X</button>
          </header>

          <form onSubmit={handleSubmitCategory}>
            <div className="flex flex-col">
              <label htmlFor="name">메뉴명</label>
              <input
                id="name"
                className="border"
                onChange={handleInputChange}
                value={categoryName}
              />
            </div>

            <div className="flex justify-end gap-x-2">
              <button onClick={initFormData} type="button">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!!!categoryName}
                className="disabled:bg-red-500"
              >
                저장
              </button>
            </div>
          </form>
        </div>
      )}

      {showCategoryManageModal && (
        <div className="absolute bg-red-100">
          <header className="flex justify-between">
            <h2>카테고리 관리</h2>
            <button onClick={closeCategoryModal}>X</button>
          </header>

          <div className="flex flex-col">
            <ul>
              {categories.map((c) => (
                <li key={c.id} className="flex gap-x-2">
                  <div>
                    <button>순서조정</button>
                  </div>
                  <span>{c.name}</span>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory(c);
                        setCategoryName(c.name);
                        setShowCategoryAddForm(true);
                      }}
                    >
                      수정
                    </button>
                    <button type="button" onClick={() => deleteCategory(c.id)}>
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <ul className={`flex gap-x-2`}>
        {categories.map((c) => (
          <li key={c.id}>
            <span>{c.name}</span>
          </li>
        ))}
      </ul>

      <div className="flex gap-x-2">
        <button onClick={handleAddCatergory}> + Category </button>
        <button onClick={handleManageCatergory}>Manange </button>
      </div>
    </div>
  );
}
