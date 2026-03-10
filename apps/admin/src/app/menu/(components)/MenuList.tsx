'use client';
import React, { useState } from 'react';

import { useRouter } from 'next/navigation';

import MenuCard from './MenuCard';

import type { Category, Menu } from '@kiosk/shared';

import { API_URL } from '../page';

interface FormData {
  name: string;
  category_id: number | null;
  description: string | null;
  price: number | null;
  image_url: string | null;
  is_available: boolean;
}

export default function MenuList({
  menus,
  categories,
}: {
  menus: Menu[];
  categories: Category[];
}) {
  const router = useRouter();

  const [showMenuForm, setShowMenuForm] = useState(false);
  const [menuFormData, setMenuFormData] = useState<FormData>({
    name: '',
    category_id: categories[0].id,
    description: '',
    price: null,
    image_url: '',
    is_available: true,
  });
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);

  const initFormData = () => {
    setMenuFormData({
      name: '',
      category_id: categories[0].id,
      description: '',
      price: 0,
      image_url: '',
      is_available: true,
    });
    setShowMenuForm(false);

    if (selectedMenu) {
      setSelectedMenu(null);
    }
  };

  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLInputElement, HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement, HTMLTextAreaElement>,
  ) => {
    const { value, id, type } = e.target;

    if (type === 'number')
      setMenuFormData((prev) => ({ ...prev, [id]: Number(value) }));
    else setMenuFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleChangeCategory = (
    e: React.ChangeEvent<HTMLSelectElement, HTMLSelectElement>,
  ) => {
    const { value } = e.target;
    if (typeof Number(value) === 'number') {
      setMenuFormData((prev) => ({ ...prev, category_id: Number(value) }));
    }
  };

  const handleToggleAvailable = (
    e: React.ChangeEvent<HTMLInputElement, HTMLInputElement>,
  ) => {
    const { checked } = e.target;

    setMenuFormData((prev) => ({
      ...prev,
      is_available: checked,
    }));
  };

  const addMenu = async (formData: FormData) => {
    const response = await fetch(`${API_URL}/api/menus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    return response;
  };

  const updateMenu = async (formData: FormData, id: number) => {
    const response = await fetch(`${API_URL}/api/menus/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    return response;
  };

  const deleteMenu = async (id: number) => {
    const response = await fetch(`${API_URL}/api/menus/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    return response;
  };

  const handleFormSumbit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = !selectedMenu
      ? await addMenu(menuFormData)
      : await updateMenu(menuFormData, selectedMenu.id);
    const data = await result.json();

    if (result.ok) {
      initFormData();
      router.refresh();
    } else {
      console.error(data);
    }
  };

  const handleEditMenu = (menu: Menu) => {
    setShowMenuForm(true);
    setSelectedMenu(menu);
    setMenuFormData({ ...menu });
  };

  const handleDeleteMenu = async (id: number, name: string) => {
    const confirmedDelete = window.confirm(`${name} 메뉴를 삭제하시겠습니까? `);

    if (confirmedDelete) {
      const result = await deleteMenu(id);
      if (result.ok) {
        router.refresh();
      }
    }
  };

  const formType = selectedMenu ? '수정' : '추가';

  return (
    <div>
      {showMenuForm && (
        <div className="absolute bg-red-100">
          <div className="flex justify-between">
            <h1>메뉴 {formType}</h1>
            <button onClick={initFormData}>X</button>
          </div>

          <form onSubmit={handleFormSumbit}>
            {/* <div className="flex flex-col">
              <label htmlFor="name">이미지</label>
              <div className="flex">
                <div>
                  <button type="button" className="h-10 w-10 bg-blue-100">
                    사진
                  </button>
                </div>

                <div>
                  <p>메뉴 이미지를 업로드하기 위해서 클릭해주세요.</p>
                </div>
              </div>
            </div> */}
            <div className="flex flex-col">
              <label htmlFor="name">메뉴명</label>
              <input
                id="name"
                className="border"
                onChange={handleInputChange}
                value={menuFormData.name}
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="description">설명</label>
              <textarea
                id="description"
                className="border"
                onChange={handleInputChange}
                value={menuFormData.description || ''}
              />
            </div>

            <div className="flex flex-1">
              <div className="flex flex-col">
                <label htmlFor="price">가격</label>
                <input
                  id="price"
                  className="border"
                  type="number"
                  min={0}
                  onChange={handleInputChange}
                  value={Number(menuFormData.price).toFixed()}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="category">카테고리</label>
                <select
                  id="category"
                  value={menuFormData.category_id || undefined}
                  onChange={handleChangeCategory}
                >
                  {categories.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col">
              <div>
                <label htmlFor="is_available">이용가능 여부</label>
                <p>메뉴의 이용가능 여부를 선택합니다.</p>
              </div>
              <input
                id="is_available"
                className="border"
                type="checkbox"
                onChange={handleToggleAvailable}
                checked={menuFormData.is_available}
              />
            </div>

            <div className="flex justify-end gap-x-2">
              <button onClick={initFormData} type="button">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!!!menuFormData.name || menuFormData.price === null}
                className="disabled:bg-red-500"
              >
                {formType}
              </button>
            </div>
          </form>
        </div>
      )}
      <div>
        <button onClick={() => setShowMenuForm(true)}>+ 메뉴추가</button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {menus?.map((m: Menu) => (
          <MenuCard
            key={m.id}
            id={m.id}
            name={m.name}
            description={m.description}
            price={m.price}
            is_available={m.is_available}
            image_url={m.image_url}
            handleEditMenu={() => handleEditMenu(m)}
            handleDeleteMenu={() => handleDeleteMenu(m.id, m.name)}
          />
        ))}
      </div>
    </div>
  );
}
