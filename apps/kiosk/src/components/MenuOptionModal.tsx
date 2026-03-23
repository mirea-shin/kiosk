import { useState } from 'react';
import type { MenuOption } from '@kiosk/shared';
import type { MenuWithOptions } from '../lib/api';

interface Props {
  menu: MenuWithOptions;
  onClose: () => void;
  onAdd: (selectedOptions: MenuOption[], quantity: number) => void;
}

export default function MenuOptionModal({ menu, onClose, onAdd }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [quantity, setQuantity] = useState(1);

  const toggle = (optionId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) next.delete(optionId);
      else next.add(optionId);
      return next;
    });
  };

  const selectedOptions = menu.options.filter((o) => selected.has(o.id));
  const optionsPrice = selectedOptions.reduce((s, o) => s + o.price, 0);
  const totalPrice = (menu.price + optionsPrice) * quantity;

  const handleAdd = () => {
    onAdd(selectedOptions, quantity);
    onClose();
  };

  return (
    <div
      className="absolute inset-0 bg-black/60 z-50 flex items-end"
      onClick={onClose}
    >
      <div
        className="w-full bg-white rounded-t-[40px] px-10 pt-10 pb-14"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 핸들 */}
        <div className="w-16 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />

        {/* 메뉴 정보 */}
        <div className="flex gap-6 mb-10">
          {menu.image_url ? (
            <img
              src={menu.image_url}
              alt={menu.name}
              className="w-36 h-36 rounded-2xl object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-36 h-36 rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-5xl">
              🍽️
            </div>
          )}
          <div className="flex flex-col justify-center">
            <h2 className="text-4xl font-bold mb-2">{menu.name}</h2>
            {menu.description && (
              <p className="text-xl text-gray-400 mb-3">{menu.description}</p>
            )}
            <p className="text-3xl font-bold text-orange-500">
              {menu.price.toLocaleString()}원
            </p>
          </div>
        </div>

        {/* 옵션 목록 */}
        {menu.options.length > 0 && (
          <div className="mb-10">
            <h3 className="text-2xl font-bold mb-5 text-gray-700">옵션 선택</h3>
            <div className="space-y-3">
              {menu.options.map((option) => {
                const isSelected = selected.has(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => toggle(option.id)}
                    className={`w-full flex justify-between items-center px-7 py-5 rounded-2xl border-2 text-2xl transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-100 bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span>{option.name}</span>
                    </div>
                    <span className={isSelected ? 'text-orange-500' : 'text-gray-400'}>
                      +{option.price.toLocaleString()}원
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 수량 */}
        <div className="flex items-center justify-between mb-10">
          <span className="text-2xl font-bold text-gray-700">수량</span>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-16 h-16 rounded-full border-2 border-gray-200 flex items-center justify-center text-3xl text-gray-500 active:bg-gray-100"
            >
              −
            </button>
            <span className="text-4xl font-bold w-12 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-16 h-16 rounded-full bg-orange-500 text-white flex items-center justify-center text-3xl active:bg-orange-600"
            >
              +
            </button>
          </div>
        </div>

        {/* 담기 버튼 */}
        <button
          onClick={handleAdd}
          className="w-full py-7 bg-orange-500 active:bg-orange-600 text-white text-3xl font-bold rounded-2xl transition-colors"
        >
          {totalPrice.toLocaleString()}원 담기
        </button>
      </div>
    </div>
  );
}
