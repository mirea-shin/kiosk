import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type MenuWithOptions } from '../lib/api';
import { useCartStore, calcTotal } from '../stores/cartStore';
import MenuOptionModal from '../components/MenuOptionModal';
import LazyImage from '../components/LazyImage';
import type { MenuOption } from '@kiosk/shared';

interface Props {
  onGoCart: () => void;
}

export default function MenuScreen({ onGoCart }: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [activeMenu, setActiveMenu] = useState<MenuWithOptions | null>(null);
  const [toast, setToast] = useState<{ name: string; key: number } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const { data: categories = [], isError: isCatError, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: api.categories,
  });

  useEffect(() => {
    if (categories.length > 0 && selectedCategoryId === null) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const { data: menus = [], isLoading, isError: isMenuError, refetch: refetchMenus } = useQuery({
    queryKey: ['menus', selectedCategoryId],
    queryFn: () => api.menus(selectedCategoryId ?? undefined),
    enabled: selectedCategoryId !== null,
  });

  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = calcTotal(items);

  const showToast = (name: string) => {
    clearTimeout(toastTimer.current);
    setToast({ name, key: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  };

  const handleMenuTap = (menu: MenuWithOptions) => {
    if (!menu.is_available) return;
    if (menu.options.length > 0) {
      setActiveMenu(menu);
    } else {
      addItem(menu, [], 1);
      showToast(menu.name);
    }
  };

  const handleAddToCart = (selectedOptions: MenuOption[], quantity: number) => {
    if (activeMenu) {
      addItem(activeMenu, selectedOptions, quantity);
      showToast(activeMenu.name);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 relative">
      {/* 헤더 */}
      <header className="bg-white px-10 py-7 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <h1 className="text-5xl font-black text-gray-900 tracking-tight">메뉴</h1>
        <p className="text-xl text-gray-400">원하시는 메뉴를 선택하세요</p>
      </header>

      {/* 카테고리 탭 */}
      <div className="bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex gap-3 overflow-x-auto px-6 py-4" style={{ scrollbarWidth: 'none' }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`flex-shrink-0 px-8 py-4 rounded-full text-2xl font-semibold transition-all ${
                selectedCategoryId === cat.id
                  ? 'bg-brand text-white shadow-md'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 메뉴 그리드 */}
      <div className="flex-1 overflow-y-auto p-6">
        {isCatError || isMenuError ? (
          <div className="flex flex-col items-center justify-center h-full gap-8 text-gray-400">
            <span className="text-8xl">⚠️</span>
            <p className="text-3xl font-bold text-gray-500">메뉴를 불러오지 못했습니다</p>
            <button
              onClick={() => { refetchCategories(); refetchMenus(); }}
              className="px-12 py-5 bg-brand text-white text-2xl font-bold rounded-2xl active:bg-brand-dark"
            >
              다시 시도
            </button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-3xl animate-pulse h-[500px]" />
            ))}
          </div>
        ) : menus.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-2xl">
            메뉴가 없습니다
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            {menus.map((menu) => (
              <MenuCard key={menu.id} menu={menu} onTap={() => handleMenuTap(menu)} />
            ))}
          </div>
        )}
      </div>

      {/* 담기 토스트 */}
      {toast && (
        <div
          key={toast.key}
          className={`cart-toast pointer-events-none absolute left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full bg-gray-900/90 px-8 py-4 shadow-xl ${cartCount > 0 ? 'bottom-36' : 'bottom-16'}`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white text-lg font-bold">✓</span>
          <span className="text-white text-2xl font-semibold whitespace-nowrap">
            {toast.name} 담겼어요
          </span>
        </div>
      )}

      {/* 장바구니 바 */}
      {cartCount > 0 && (
        <button
          onClick={onGoCart}
          className="flex-shrink-0 bg-gray-900 px-10 py-7 flex items-center justify-between active:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-4">
            <span
              key={cartCount}
              className="badge-pop w-10 h-10 bg-brand rounded-full text-white text-xl font-bold flex items-center justify-center"
            >
              {cartCount}
            </span>
            <span className="text-white text-2xl font-semibold">장바구니 보기</span>
          </div>
          <span className="text-brand-subtle text-3xl font-bold">
            {cartTotal.toLocaleString()}원 →
          </span>
        </button>
      )}

      {/* 옵션 모달 */}
      {activeMenu && (
        <MenuOptionModal
          menu={activeMenu}
          onClose={() => setActiveMenu(null)}
          onAdd={handleAddToCart}
        />
      )}
    </div>
  );
}

function MenuCard({ menu, onTap }: { menu: MenuWithOptions; onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      disabled={!menu.is_available}
      className="bg-white rounded-3xl shadow-sm overflow-hidden text-left active:scale-[0.98] transition-transform disabled:opacity-40 border border-gray-50"
    >
      {/* 이미지 */}
      <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
        {menu.image_url ? (
          <LazyImage src={menu.image_url} alt={menu.name} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl text-gray-200">
            🍽️
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-1 line-clamp-1">{menu.name}</h3>
        {menu.description && (
          <p className="text-lg text-gray-400 mb-3 line-clamp-2 leading-snug">
            {menu.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <p className="text-3xl font-black text-brand">
            {menu.price.toLocaleString()}원
          </p>
          {!menu.is_available && (
            <span className="text-lg text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              품절
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
