'use client';
import React, { useState, useEffect, useRef } from 'react';

import { useRouter } from 'next/navigation';
import { Loader2, Plus, Upload, UtensilsCrossed, X } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import MenuCard from './MenuCard';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';

import type { Category, Menu } from '@kiosk/shared';

import { API_URL } from '@/lib/api';

interface FormData {
  name: string;
  category_id: number | null;
  description: string | null;
  price: number | null;
  image_url: string | null;
  is_available: boolean;
}

// ── SortableMenuCard ───────────────────────────────────

function SortableMenuCard({
  menu,
  handleEditMenu,
  handleDeleteMenu,
  handleToggleAvailable,
}: {
  menu: Menu;
  handleEditMenu: () => void;
  handleDeleteMenu: () => void;
  handleToggleAvailable: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: menu.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
      }}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
      {...attributes}
      {...listeners}
    >
      <MenuCard
        id={menu.id}
        name={menu.name}
        description={menu.description}
        price={menu.price}
        is_available={menu.is_available}
        image_url={menu.image_url}
        handleEditMenu={handleEditMenu}
        handleDeleteMenu={handleDeleteMenu}
        handleToggleAvailable={handleToggleAvailable}
        isDragging={isDragging}
      />
    </div>
  );
}

// ── MenuList ───────────────────────────────────────────

export default function MenuList({
  menus,
  categories,
  selectedCategory,
}: {
  menus: Menu[];
  categories: Category[];
  selectedCategory: Category;
}) {
  const router = useRouter();

  const [localMenus, setLocalMenus] = useState<Menu[]>(menus);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Menu | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [menuFormData, setMenuFormData] = useState<FormData>({
    name: '',
    category_id: selectedCategory.id,
    description: '',
    price: null,
    image_url: '',
    is_available: true,
  });
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);

  // 카테고리 전환이나 서버 refresh 시 동기화
  useEffect(() => {
    setLocalMenus(menus);
  }, [menus]);

  // ── DnD ───────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localMenus.findIndex((m) => m.id === active.id);
    const newIndex = localMenus.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(localMenus, oldIndex, newIndex);

    setLocalMenus(reordered); // optimistic update

    await fetch(`${API_URL}/api/menus/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reordered.map((m, i) => ({ id: m.id, sort_order: i + 1 }))),
    });
  };

  // ── CRUD ──────────────────────────────────────────────

  const initFormData = () => {
    setMenuFormData({
      name: '',
      category_id: selectedCategory.id,
      description: '',
      price: 0,
      image_url: null,
      is_available: true,
    });
    setShowMenuForm(false);
    if (selectedMenu) setSelectedMenu(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch(`${API_URL}/api/menus/upload`, { method: 'POST', body });
      const data = await res.json();
      if (res.ok) setMenuFormData((prev) => ({ ...prev, image_url: data.url }));
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const { value, id, type } = e.target;
    if (type === 'number') {
      setMenuFormData((prev) => ({ ...prev, [id]: Number(value) }));
    } else {
      setMenuFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleChangeCategory = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMenuFormData((prev) => ({ ...prev, category_id: Number(e.target.value) }));
  };

  const handleToggleAvailable = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMenuFormData((prev) => ({ ...prev, is_available: e.target.checked }));
  };

  const addMenu = async (formData: FormData) => {
    return fetch(`${API_URL}/api/menus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
  };

  const updateMenu = async (formData: FormData | Menu, id: number) => {
    return fetch(`${API_URL}/api/menus/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
  };

  const deleteMenu = async (id: number) => {
    return fetch(`${API_URL}/api/menus/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

  const handleDeleteMenu = async (id: number) => {
    const result = await deleteMenu(id);
    if (result.ok) router.refresh();
  };

  const handleToggleMenuAvailable = async (menu: Menu) => {
    await updateMenu({ ...menu, is_available: !menu.is_available }, menu.id);
    router.refresh();
  };

  const formType = selectedMenu ? '수정' : '추가';

  return (
    <div>
      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={`'${deleteTarget?.name}' 메뉴를 삭제할까요?`}
        description="삭제한 메뉴는 복구할 수 없습니다."
        confirmLabel="삭제"
        onConfirm={async () => {
          if (deleteTarget) await handleDeleteMenu(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Menu Add / Edit Modal */}
      {showMenuForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[480px] rounded-2xl bg-white p-6 shadow-xl">
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">메뉴 {formType}</h2>
              <button onClick={initFormData} className="text-gray-400 hover:text-gray-600">✕</button>
            </header>
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              {/* Image upload */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">이미지</label>
                <div
                  onClick={() => !uploadingImage && fileInputRef.current?.click()}
                  className={`relative flex h-36 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
                    menuFormData.image_url
                      ? 'border-transparent'
                      : 'border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50'
                  }`}
                >
                  {menuFormData.image_url ? (
                    <>
                      <img
                        src={menuFormData.image_url}
                        alt="preview"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/30">
                        <Upload size={20} className="text-white opacity-0 transition-opacity hover:opacity-100" />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuFormData((prev) => ({ ...prev, image_url: null }));
                        }}
                        className="absolute right-2 top-2 rounded-full bg-white/90 p-1 shadow hover:bg-red-50"
                      >
                        <X size={14} className="text-red-500" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-gray-400">
                      {uploadingImage ? (
                        <Loader2 size={24} className="animate-spin" />
                      ) : (
                        <Upload size={24} />
                      )}
                      <span className="text-xs">
                        {uploadingImage ? '업로드 중...' : '클릭하여 이미지 업로드'}
                      </span>
                      <span className="text-xs text-gray-300">JPG · PNG · WebP · GIF · 최대 10MB</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="name" className="text-sm font-medium text-gray-700">메뉴명</label>
                <input
                  id="name"
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                  onChange={handleInputChange}
                  value={menuFormData.name}
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="description" className="text-sm font-medium text-gray-700">설명</label>
                <textarea
                  id="description"
                  rows={3}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                  onChange={handleInputChange}
                  value={menuFormData.description || ''}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex flex-1 flex-col gap-1">
                  <label htmlFor="price" className="text-sm font-medium text-gray-700">가격</label>
                  <input
                    id="price"
                    type="number"
                    min={0}
                    className="rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                    onChange={handleInputChange}
                    value={Number(menuFormData.price).toFixed()}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <label htmlFor="category" className="text-sm font-medium text-gray-700">카테고리</label>
                  <select
                    id="category"
                    className="rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                    value={menuFormData.category_id || undefined}
                    onChange={handleChangeCategory}
                  >
                    {categories.map((c) => (
                      <option value={c.id} key={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">이용 가능 여부</p>
                  <p className="text-xs text-gray-500">메뉴의 이용 가능 여부를 선택합니다.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    onChange={handleToggleAvailable}
                    checked={menuFormData.is_available}
                  />
                  <div className="relative h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-green-500 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all after:content-[''] peer-checked:after:translate-x-5" />
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={initFormData}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!menuFormData.name || menuFormData.price === null}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {formType}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{selectedCategory.name}</h2>
        <button
          onClick={() => setShowMenuForm(true)}
          className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      {/* Menu grid with DnD */}
      {localMenus.length === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed size={28} />}
          title="등록된 메뉴가 없습니다"
          description="이 카테고리에 메뉴를 추가해보세요."
          action={
            <button
              onClick={() => setShowMenuForm(true)}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <Plus size={16} />
              Add Item
            </button>
          }
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={localMenus.map((m) => m.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-4">
              {localMenus.map((m) => (
                <SortableMenuCard
                  key={m.id}
                  menu={m}
                  handleEditMenu={() => handleEditMenu(m)}
                  handleDeleteMenu={() => setDeleteTarget(m)}
                  handleToggleAvailable={() => handleToggleMenuAvailable(m)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
