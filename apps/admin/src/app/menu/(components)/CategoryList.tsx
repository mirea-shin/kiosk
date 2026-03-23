'use client';
import { useState, useEffect } from 'react';
import { Category, Menu } from '@kiosk/shared';
import React from 'react';
import { API_URL } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { GripVertical, Plus, SlidersHorizontal } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
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
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ── SortableCategoryRow ────────────────────────────────

function SortableCategoryRow({
  category,
  onEdit,
  onDelete,
}: {
  category: Category;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="flex items-center justify-between py-3"
    >
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </button>
        <span className="font-medium">{category.name}</span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
        >
          수정
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded px-2 py-1 text-sm text-red-500 hover:bg-red-50"
        >
          삭제
        </button>
      </div>
    </li>
  );
}

// ── CategoryList ───────────────────────────────────────

export default function CategoryList({
  categories,
  menus,
  selectedCategoryId,
  onSelectCategory,
}: {
  categories: Category[];
  menus: Menu[];
  selectedCategoryId: number;
  onSelectCategory: (id: number) => void;
}) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [sortedCategories, setSortedCategories] = useState<Category[]>(categories);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  // 서버 refresh 시 동기화
  useEffect(() => {
    setSortedCategories(categories);
  }, [categories]);

  // ── DnD ───────────────────────────────────────────────

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedCategories.findIndex((c) => c.id === active.id);
    const newIndex = sortedCategories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(sortedCategories, oldIndex, newIndex);

    setSortedCategories(reordered); // optimistic update

    await fetch(`${API_URL}/api/categories/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reordered.map((c, i) => ({ id: c.id, sort_order: i + 1 }))),
    });
  };

  // ── CRUD ──────────────────────────────────────────────

  const closeAddForm = () => {
    setCategoryName('');
    setEditingCategory(undefined);
    setShowAddForm(false);
  };

  const closeManageModal = () => {
    setShowManageModal(false);
    router.refresh(); // 탭 순서 서버 데이터와 동기화
  };

  const addCategory = async (name: string) => {
    return fetch(`${API_URL}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
  };

  const updateCategory = async (id: number, name: string, sort_order: number) => {
    return fetch(`${API_URL}/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, sort_order }),
    });
  };

  const deleteCategory = async (id: number) => {
    const response = await fetch(`${API_URL}/api/categories/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await response.json();
    if (result.success) router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!categoryName) return;
    if (editingCategory) {
      const result = await updateCategory(editingCategory.id, categoryName, editingCategory.sort_order);
      if (result.ok) {
        closeAddForm();
        router.refresh();
      }
    } else {
      const result = await addCategory(categoryName);
      if (result.ok) {
        closeAddForm();
        router.refresh();
      }
    }
  };

  const menuCount = (categoryId: number) =>
    menus.filter((m) => m.category_id === categoryId).length;

  return (
    <div className="mb-6">
      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={`'${deleteTarget?.name}' 카테고리를 삭제할까요?`}
        description="카테고리 내 모든 메뉴 데이터가 함께 삭제됩니다."
        confirmLabel="삭제"
        onConfirm={async () => {
          if (deleteTarget) await deleteCategory(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Add / Edit Modal — manage modal(z-50) 위에 표시되어야 하므로 z-[60] */}
      {showAddForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="w-96 rounded-2xl bg-white p-6 shadow-xl">
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">카테고리 {editingCategory ? '수정' : '추가'}</h2>
              <button onClick={closeAddForm} className="text-gray-400 hover:text-gray-600">✕</button>
            </header>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="cat-name" className="text-sm font-medium text-gray-700">카테고리명</label>
                <input
                  id="cat-name"
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                  onChange={(e) => setCategoryName(e.target.value)}
                  value={categoryName}
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAddForm}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!categoryName}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Modal (with DnD) */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-2xl bg-white p-6 shadow-xl">
            <header className="mb-1 flex items-center justify-between">
              <h2 className="text-lg font-bold">카테고리 관리</h2>
              <button onClick={closeManageModal} className="text-gray-400 hover:text-gray-600">✕</button>
            </header>
            <p className="mb-4 text-xs text-gray-400">드래그하여 순서를 변경할 수 있습니다.</p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedCategories.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="divide-y divide-gray-100">
                  {sortedCategories.map((c) => (
                    <SortableCategoryRow
                      key={c.id}
                      category={c}
                      onEdit={() => {
                        setEditingCategory(c);
                        setCategoryName(c.name);
                        setShowAddForm(true);
                      }}
                      onDelete={() => setDeleteTarget(c)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-1">
          {categories.map((c) => {
            const isActive = c.id === selectedCategoryId;
            return (
              <button
                key={c.id}
                onClick={() => onSelectCategory(c.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{c.name}</span>
                <span
                  className={`inline-flex h-5 min-w-6 items-center justify-center rounded-full px-1 text-xs tabular-nums ${
                    isActive ? 'bg-green-500 text-green-100' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {menuCount(c.id)}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Plus size={15} />
            Add
          </button>
          <button
            onClick={() => setShowManageModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <SlidersHorizontal size={15} />
            Manage
          </button>
        </div>
      </div>
    </div>
  );
}
