'use client';
import React from 'react';
import type { Category } from '@kiosk/shared';

const CAT_NAME_MAX = 10;

interface Props {
  isOpen: boolean;
  editingCategory: Category | undefined;
  categoryName: string;
  onNameChange: (name: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

export default function CategoryForm({
  isOpen,
  editingCategory,
  categoryName,
  onNameChange,
  onSubmit,
  onClose,
}: Props) {
  if (!isOpen) return null;

  const formType = editingCategory ? '수정' : '추가';

  return (
    // 카테고리 관리 모달(z-50) 위에 표시되도록 z-[60]
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="w-96 rounded-2xl bg-white p-6 shadow-xl">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">카테고리 {formType}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </header>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label htmlFor="cat-name" className="text-sm font-medium text-gray-700">
                카테고리명
              </label>
              <span className={`text-xs ${categoryName.length >= CAT_NAME_MAX ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                {categoryName.length} / {CAT_NAME_MAX}
              </span>
            </div>
            <input
              id="cat-name"
              maxLength={CAT_NAME_MAX}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
              onChange={(e) => onNameChange(e.target.value)}
              value={categoryName}
              autoFocus
            />
            <p className="text-xs text-gray-400">키오스크 탭에 표시됩니다</p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!categoryName.trim() || categoryName.length > CAT_NAME_MAX}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
