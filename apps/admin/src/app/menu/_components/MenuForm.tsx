'use client';
import React from 'react';
import { Loader2, Plus, Upload, X } from 'lucide-react';
import type { Category, MenuOption } from '@kiosk/shared';

const MENU_NAME_MAX = 20;
const MENU_DESC_MAX = 60;
const PRICE_MIN = 100;
const PRICE_MAX = 99999;
const OPT_NAME_MAX = 15;
const OPT_PRICE_MAX = 50000;
const OPT_COUNT_MAX = 5;

export interface MenuFormData {
  name: string;
  category_id: number | null;
  description: string | null;
  price: number | null;
  image_url: string | null;
  is_available: boolean;
}

export interface PendingOption {
  name: string;
  price: number;
}

export interface MenuFormProps {
  isOpen: boolean;
  formType: '추가' | '수정';
  formData: MenuFormData;
  categories: Category[];
  uploadingImage: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  // 옵션 (수정 모드: 서버 저장된 옵션 / 추가 모드: 임시 옵션)
  isEditMode: boolean;
  options: MenuOption[];
  pendingOptions: PendingOption[];
  newOptionName: string;
  newOptionPrice: number;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCategoryChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onToggleAvailable: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageClear: () => void;
  onOptionNameChange: (v: string) => void;
  onOptionPriceChange: (v: number) => void;
  onAddOption: () => void;
  onDeleteOption: (id: number) => void;
  onDeletePendingOption: (index: number) => void;
}

export default function MenuForm({
  isOpen,
  formType,
  formData,
  categories,
  uploadingImage,
  fileInputRef,
  isEditMode,
  options,
  pendingOptions,
  newOptionName,
  newOptionPrice,
  onClose,
  onSubmit,
  onInputChange,
  onCategoryChange,
  onToggleAvailable,
  onImageUpload,
  onImageClear,
  onOptionNameChange,
  onOptionPriceChange,
  onAddOption,
  onDeleteOption,
  onDeletePendingOption,
}: MenuFormProps) {
  if (!isOpen) return null;

  const currentOptionCount = isEditMode
    ? options.length + pendingOptions.length
    : pendingOptions.length;
  const isOptionLimitReached = currentOptionCount >= OPT_COUNT_MAX;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[480px] rounded-2xl bg-white p-6 shadow-xl">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">메뉴 {formType}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </header>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* 이미지 업로드 */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">이미지</label>
            <div
              onClick={() => !uploadingImage && fileInputRef.current?.click()}
              className={`relative flex h-36 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
                formData.image_url
                  ? 'border-transparent'
                  : 'border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50'
              }`}
            >
              {formData.image_url ? (
                <>
                  <img src={formData.image_url} alt="preview" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/30">
                    <Upload size={20} className="text-white opacity-0 transition-opacity hover:opacity-100" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onImageClear(); }}
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
              onChange={onImageUpload}
            />
          </div>

          {/* 메뉴명 */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">메뉴명</label>
              <span className={`text-xs ${formData.name.length >= MENU_NAME_MAX ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                {formData.name.length} / {MENU_NAME_MAX}
              </span>
            </div>
            <input
              id="name"
              maxLength={MENU_NAME_MAX}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
              onChange={onInputChange}
              value={formData.name}
              autoFocus
            />
          </div>

          {/* 설명 */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">설명</label>
              <span className={`text-xs ${(formData.description?.length ?? 0) >= MENU_DESC_MAX ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                {formData.description?.length ?? 0} / {MENU_DESC_MAX}
              </span>
            </div>
            <textarea
              id="description"
              rows={3}
              maxLength={MENU_DESC_MAX}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
              onChange={onInputChange}
              value={formData.description || ''}
            />
          </div>

          {/* 가격 + 카테고리 */}
          <div className="flex gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="price" className="text-sm font-medium text-gray-700">가격</label>
              <input
                id="price"
                type="number"
                min={PRICE_MIN}
                max={PRICE_MAX}
                className="rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                onChange={onInputChange}
                value={Number(formData.price).toFixed()}
              />
              {formData.price !== null && (formData.price < PRICE_MIN || formData.price > PRICE_MAX) && (
                <p className="text-xs text-red-500">
                  {PRICE_MIN.toLocaleString()}원 ~ {PRICE_MAX.toLocaleString()}원 사이로 입력하세요
                </p>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="category" className="text-sm font-medium text-gray-700">카테고리</label>
              <select
                id="category"
                className="rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                value={formData.category_id || undefined}
                onChange={onCategoryChange}
              >
                {categories.map((c) => (
                  <option value={c.id} key={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 옵션 관리 */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">옵션</label>
              <span className={`text-xs ${isOptionLimitReached ? 'text-amber-500 font-medium' : 'text-gray-400'}`}>
                {currentOptionCount} / {OPT_COUNT_MAX}
              </span>
            </div>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              {/* 옵션 목록 */}
              {isEditMode ? (
                options.length === 0 && pendingOptions.length === 0 ? (
                  <p className="py-3 text-center text-xs text-gray-400">등록된 옵션이 없습니다</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {options.map((option) => (
                      <li key={option.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
                        <span className="text-gray-800">{option.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">+{option.price.toLocaleString()}원</span>
                          <button type="button" onClick={() => onDeleteOption(option.id)} className="text-red-400 hover:text-red-600">
                            <X size={14} />
                          </button>
                        </div>
                      </li>
                    ))}
                    {pendingOptions.map((option, index) => (
                      <li key={`pending-${index}`} className="flex items-center justify-between px-3 py-2.5 text-sm bg-green-50">
                        <span className="text-gray-800">{option.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">+{option.price.toLocaleString()}원</span>
                          <button type="button" onClick={() => onDeletePendingOption(index)} className="text-red-400 hover:text-red-600">
                            <X size={14} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              ) : (
                pendingOptions.length === 0 ? (
                  <p className="py-3 text-center text-xs text-gray-400">등록된 옵션이 없습니다</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {pendingOptions.map((option, index) => (
                      <li key={index} className="flex items-center justify-between px-3 py-2.5 text-sm">
                        <span className="text-gray-800">{option.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">+{option.price.toLocaleString()}원</span>
                          <button
                            type="button"
                            onClick={() => onDeletePendingOption(index)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              )}

              {/* 옵션 추가 입력 */}
              <div className="flex gap-2 border-t border-gray-100 bg-gray-50 px-3 py-2">
                <input
                  type="text"
                  placeholder="옵션명"
                  maxLength={OPT_NAME_MAX}
                  value={newOptionName}
                  onChange={(e) => onOptionNameChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAddOption())}
                  className="flex-1 rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-green-500 focus:outline-none"
                />
                <input
                  type="number"
                  min={0}
                  max={OPT_PRICE_MAX}
                  placeholder="추가 가격"
                  value={newOptionPrice}
                  onChange={(e) => onOptionPriceChange(Number(e.target.value))}
                  className="w-24 rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-green-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={onAddOption}
                  disabled={!newOptionName.trim() || isOptionLimitReached}
                  title={isOptionLimitReached ? `옵션은 최대 ${OPT_COUNT_MAX}개까지 추가할 수 있습니다` : undefined}
                  className="flex items-center gap-1 rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={13} />
                  추가
                </button>
              </div>
            </div>
          </div>

          {/* 이용 가능 여부 */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-700">이용 가능 여부</p>
              <p className="text-xs text-gray-500">메뉴의 이용 가능 여부를 선택합니다.</p>
            </div>
            <label className="inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                onChange={onToggleAvailable}
                checked={formData.is_available}
              />
              <div className="relative h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-green-500 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all after:content-[''] peer-checked:after:translate-x-5" />
            </label>
          </div>

          {/* 버튼 */}
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
              disabled={
                !formData.name.trim() ||
                formData.price === null ||
                formData.price < PRICE_MIN ||
                formData.price > PRICE_MAX
              }
              className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
            >
              {formType}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
