'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GripVertical, Plus, SlidersHorizontal } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Category, Menu } from '@kiosk/shared';
import { api } from '@/lib/api-client';
import ConfirmDialog from '@/components/ConfirmDialog';
import CategoryForm from './CategoryForm';

const CATEGORY_MAX = 8;
const CAT_NAME_MAX = 10;

// ── SortableCategoryRow ──────────────────────────────────

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
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
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
        <button type="button" onClick={onEdit} className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100">
          수정
        </button>
        <button type="button" onClick={onDelete} className="rounded px-2 py-1 text-sm text-red-500 hover:bg-red-50">
          삭제
        </button>
      </div>
    </li>
  );
}

// ── CategoryList ─────────────────────────────────────────

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

  useEffect(() => { setSortedCategories(categories); }, [categories]);

  const sensors = useSensors(useSensor(PointerSensor));

  // ── DnD ─────────────────────────────────────────────────
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sortedCategories.findIndex((c) => c.id === active.id);
    const newIndex = sortedCategories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(sortedCategories, oldIndex, newIndex);
    setSortedCategories(reordered);
    await api.patch('/api/categories/reorder', reordered.map((c, i) => ({ id: c.id, sort_order: i + 1 })));
  };

  // ── CRUD ────────────────────────────────────────────────
  const closeAddForm = () => {
    setCategoryName('');
    setEditingCategory(undefined);
    setShowAddForm(false);
  };

  const closeManageModal = () => {
    setShowManageModal(false);
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!categoryName.trim() || categoryName.length > CAT_NAME_MAX) return;
    if (!editingCategory && categories.length >= CATEGORY_MAX) return;

    if (editingCategory) {
      await api.put(`/api/categories/${editingCategory.id}`, {
        name: categoryName,
        sort_order: editingCategory.sort_order,
      });
    } else {
      await api.post('/api/categories', { name: categoryName });
    }
    closeAddForm();
    router.refresh();
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/api/categories/${id}`);
    setDeleteTarget(null);
    router.refresh();
  };

  const menuCount = (categoryId: number) =>
    menus.filter((m) => m.category_id === categoryId).length;

  return (
    <div className="mb-6">
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={`'${deleteTarget?.name}' 카테고리를 삭제할까요?`}
        description="카테고리 내 모든 메뉴 데이터가 함께 삭제됩니다."
        confirmLabel="삭제"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />

      <CategoryForm
        isOpen={showAddForm}
        editingCategory={editingCategory}
        categoryName={categoryName}
        onNameChange={setCategoryName}
        onSubmit={handleSubmit}
        onClose={closeAddForm}
      />

      {/* 카테고리 관리 모달 (DnD 포함) */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-2xl bg-white p-6 shadow-xl">
            <header className="mb-1 flex items-center justify-between">
              <h2 className="text-lg font-bold">카테고리 관리</h2>
              <button onClick={closeManageModal} className="text-gray-400 hover:text-gray-600">✕</button>
            </header>
            <p className="mb-4 text-xs text-gray-400">드래그하여 순서를 변경할 수 있습니다.</p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sortedCategories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
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

      {/* 탭 바 */}
      <div className="flex items-center gap-2">
        <select
          value={selectedCategoryId}
          onChange={(e) => onSelectCategory(Number(e.target.value))}
          className="sm:hidden flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({menuCount(c.id)})
            </option>
          ))}
        </select>

        <div className="hidden sm:flex flex-1 flex-wrap items-center gap-1">
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

        <div className="flex shrink-0 items-center gap-2">
          {categories.length >= CATEGORY_MAX && (
            <span className="hidden sm:block text-xs text-amber-500">최대 {CATEGORY_MAX}개</span>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            disabled={categories.length >= CATEGORY_MAX}
            title={categories.length >= CATEGORY_MAX ? `카테고리는 최대 ${CATEGORY_MAX}개까지 추가할 수 있습니다` : undefined}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={15} />
            추가
          </button>
          <button
            onClick={() => setShowManageModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <SlidersHorizontal size={15} />
            관리
          </button>
        </div>
      </div>
    </div>
  );
}
