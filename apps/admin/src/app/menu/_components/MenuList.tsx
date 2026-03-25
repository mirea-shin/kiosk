'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, UtensilsCrossed } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import type { Category, Menu, MenuOption } from '@kiosk/shared';
import { api } from '@/lib/api-client';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';
import SortableMenuCard from './SortableMenuCard';
import MenuForm, { type MenuFormData, type PendingOption } from './MenuForm';

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
  const [showForm, setShowForm] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Menu | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 폼 상태
  const [formData, setFormData] = useState<MenuFormData>(defaultFormData(selectedCategory.id));
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 옵션 상태
  const [options, setOptions] = useState<MenuOption[]>([]);
  const [pendingOptions, setPendingOptions] = useState<PendingOption[]>([]);
  const [deletingOptionIds, setDeletingOptionIds] = useState<Set<number>>(new Set());
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionPrice, setNewOptionPrice] = useState(0);

  useEffect(() => { setLocalMenus(menus); }, [menus]);

  // ── DnD ─────────────────────────────────────────────────
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localMenus.findIndex((m) => m.id === active.id);
    const newIndex = localMenus.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(localMenus, oldIndex, newIndex);
    setLocalMenus(reordered);
    await api.patch('/api/menus/reorder', reordered.map((m, i) => ({ id: m.id, sort_order: i + 1 })));
  };

  // ── 폼 초기화 ────────────────────────────────────────────
  const resetForm = () => {
    setFormData(defaultFormData(selectedCategory.id));
    setSelectedMenu(null);
    setShowForm(false);
    setOptions([]);
    setPendingOptions([]);
    setDeletingOptionIds(new Set());
    setNewOptionName('');
    setNewOptionPrice(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── CRUD ────────────────────────────────────────────────
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = selectedMenu
      ? await api.put<Menu>(`/api/menus/${selectedMenu.id}`, formData)
      : await api.post<Menu>('/api/menus', formData);

    if (selectedMenu) {
      // 수정 모드: 삭제 예약된 옵션 삭제 + 추가된 pending 옵션 생성
      await Promise.allSettled(
        [...deletingOptionIds].map((id) => api.delete(`/api/menus/${selectedMenu.id}/options/${id}`)),
      );
      if (pendingOptions.length > 0) {
        await Promise.all(
          pendingOptions.map((opt) => api.post(`/api/menus/${selectedMenu.id}/options`, opt)),
        );
      }
    } else if (pendingOptions.length > 0) {
      // 추가 모드: pending 옵션 생성
      await Promise.all(
        pendingOptions.map((opt) => api.post(`/api/menus/${res.id}/options`, opt)),
      );
    }
    resetForm();
    router.refresh();
  };

  const handleEditMenu = (menu: Menu) => {
    setSelectedMenu(menu);
    setFormData({ ...menu });
    setOptions(menu.options ?? []);
    setPendingOptions([]);
    setDeletingOptionIds(new Set());
    setNewOptionName('');
    setNewOptionPrice(0);
    setShowForm(true);
  };

  const handleDeleteMenu = async (id: number) => {
    try {
      await api.delete(`/api/menus/${id}`);
      setDeleteTarget(null);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '삭제에 실패했습니다.';
      setDeleteError(message);
    }
  };

  const handleToggleAvailable = async (menu: Menu) => {
    await api.put(`/api/menus/${menu.id}`, { ...menu, is_available: !menu.is_available });
    router.refresh();
  };

  // ── 이미지 업로드 ─────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const data = await api.upload<{ url: string }>('/api/menus/upload', body);
      setFormData((prev) => ({ ...prev, image_url: data.url }));
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── 옵션 ────────────────────────────────────────────────
  const handleAddOption = () => {
    if (!newOptionName.trim()) return;
    setPendingOptions((prev) => [...prev, { name: newOptionName.trim(), price: newOptionPrice }]);
    setNewOptionName('');
    setNewOptionPrice(0);
  };

  const handleDeleteOption = (optionId: number) => {
    setOptions((prev) => prev.filter((o) => o.id !== optionId));
    setDeletingOptionIds((prev) => new Set([...prev, optionId]));
  };

  return (
    <div>
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={`'${deleteTarget?.name}' 메뉴를 삭제할까요?`}
        description={
          deleteError
            ? <span className="text-red-500">{deleteError}</span>
            : '삭제한 메뉴는 복구할 수 없습니다.'
        }
        confirmLabel="삭제"
        onConfirm={() => deleteTarget && handleDeleteMenu(deleteTarget.id)}
        onCancel={() => { setDeleteTarget(null); setDeleteError(null); }}
      />

      <MenuForm
        isOpen={showForm}
        formType={selectedMenu ? '수정' : '추가'}
        formData={formData}
        categories={categories}
        uploadingImage={uploadingImage}
        fileInputRef={fileInputRef}
        isEditMode={!!selectedMenu}
        options={options}
        pendingOptions={pendingOptions}
        newOptionName={newOptionName}
        newOptionPrice={newOptionPrice}
        onClose={resetForm}
        onSubmit={handleFormSubmit}
        onInputChange={(e) => {
          const { value, id, type } = e.target;
          setFormData((prev) => ({ ...prev, [id]: type === 'number' ? Number(value) : value }));
        }}
        onCategoryChange={(e) =>
          setFormData((prev) => ({ ...prev, category_id: Number(e.target.value) }))
        }
        onToggleAvailable={(e) =>
          setFormData((prev) => ({ ...prev, is_available: e.target.checked }))
        }
        onImageUpload={handleImageUpload}
        onImageClear={() => setFormData((prev) => ({ ...prev, image_url: null }))}
        onOptionNameChange={setNewOptionName}
        onOptionPriceChange={setNewOptionPrice}
        onAddOption={handleAddOption}
        onDeleteOption={handleDeleteOption}
        onDeletePendingOption={(index) =>
          setPendingOptions((prev) => prev.filter((_, i) => i !== index))
        }
      />

      {/* 섹션 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{selectedCategory.name}</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          <Plus size={16} />
          메뉴 추가
        </button>
      </div>

      {localMenus.length === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed size={28} />}
          title="등록된 메뉴가 없습니다"
          description="이 카테고리에 메뉴를 추가해보세요."
          action={
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <Plus size={16} />
              메뉴 추가
            </button>
          }
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={localMenus.map((m) => m.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {localMenus.map((m) => (
                <SortableMenuCard
                  key={m.id}
                  menu={m}
                  onEdit={() => handleEditMenu(m)}
                  onDelete={() => setDeleteTarget(m)}
                  onToggleAvailable={() => handleToggleAvailable(m)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function defaultFormData(categoryId: number): MenuFormData {
  return {
    name: '',
    category_id: categoryId,
    description: '',
    price: 0,
    image_url: null,
    is_available: true,
  };
}
