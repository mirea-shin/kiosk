import { useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useCartStore, calcTotal } from '../stores/cartStore';

interface Props {
  onBack: () => void;
  onOrderComplete: (orderId: number) => void;
}

export default function CartScreen({ onBack, onOrderComplete }: Props) {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);
  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const clearTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleClearTap = () => {
    if (clearConfirm) {
      clear();
      setClearConfirm(false);
      clearTimeout(clearTimer.current);
    } else {
      setClearConfirm(true);
      clearTimer.current = setTimeout(() => setClearConfirm(false), 2500);
    }
  };

  const total = calcTotal(items);

  const handleOrder = async () => {
    setLoading(true);
    setOrderError(false);
    try {
      const orderItems = items.map((item) => ({
        menu_id: item.menu.id,
        quantity: item.quantity,
        option_ids: item.selectedOptions.map((o) => o.id),
      }));
      const order = await api.createOrder(orderItems);
      clear();
      onOrderComplete(order.id);
    } catch {
      setOrderError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 relative">
      {/* 주문 실패 모달 */}
      {orderError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-3xl px-14 py-12 mx-10 flex flex-col items-center gap-6 shadow-2xl">
            <span className="text-7xl">⚠️</span>
            <p className="text-3xl font-bold text-gray-900 text-center">주문에 실패했습니다</p>
            <p className="text-xl text-gray-400 text-center">잠시 후 다시 시도해주세요</p>
            <button
              onClick={() => setOrderError(false)}
              className="mt-2 px-14 py-5 bg-brand text-white text-2xl font-bold rounded-2xl active:bg-brand-dark"
            >
              확인
            </button>
          </div>
        </div>
      )}
      {/* 헤더 */}
      <header className="bg-white px-10 py-7 border-b border-gray-100 flex items-center gap-5 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl active:bg-gray-200 transition-colors"
        >
          ←
        </button>
        <h1 className="text-5xl font-black text-gray-900">장바구니</h1>
        <span className="ml-2 text-2xl text-gray-400 mt-1">
          {items.reduce((s, i) => s + i.quantity, 0)}개
        </span>
        {items.length > 0 && (
          <button
            onClick={handleClearTap}
            className={`ml-auto px-7 py-4 rounded-2xl text-xl font-semibold transition-colors ${
              clearConfirm
                ? 'bg-red-500 text-white active:bg-red-600'
                : 'bg-gray-100 text-gray-400 active:bg-gray-200'
            }`}
          >
            {clearConfirm ? '비울까요?' : '전체 비우기'}
          </button>
        )}
      </header>

      {/* 아이템 목록 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-gray-300">
            <span className="text-9xl">🛒</span>
            <p className="text-3xl">장바구니가 비어있어요</p>
          </div>
        ) : (
          items.map((item, index) => {
            const optPrice = item.selectedOptions.reduce((s, o) => s + o.price, 0);
            const itemTotal = (item.menu.price + optPrice) * item.quantity;

            return (
              <div key={index} className="bg-white rounded-3xl p-7 shadow-sm">
                <div className="flex items-start gap-5 mb-6">
                  {item.menu.image_url && (
                    <img
                      src={item.menu.image_url}
                      alt={item.menu.name}
                      className="w-24 h-24 rounded-2xl object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      {item.menu.name}
                    </h3>
                    {item.selectedOptions.length > 0 && (
                      <p className="text-lg text-gray-400">
                        {item.selectedOptions.map((o) => o.name).join(' · ')}
                      </p>
                    )}
                    <p className="text-xl text-gray-500 mt-1">
                      {(item.menu.price + optPrice).toLocaleString()}원
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(index)}
                    className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-2xl active:bg-gray-200 flex-shrink-0"
                  >
                    ×
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <button
                      onClick={() => updateQuantity(index, -1)}
                      className="w-14 h-14 rounded-full border-2 border-gray-200 flex items-center justify-center text-2xl text-gray-500 active:bg-gray-100"
                    >
                      −
                    </button>
                    <span className="text-3xl font-bold w-10 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(index, 1)}
                      className="w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center text-2xl active:bg-brand-dark"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-3xl font-black text-brand">
                    {itemTotal.toLocaleString()}원
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 결제 푸터 */}
      <div className="bg-white border-t border-gray-100 px-10 py-8 flex-shrink-0">
        <div className="flex justify-between items-center mb-6">
          <span className="text-2xl text-gray-500">총 주문금액</span>
          <span className="text-5xl font-black text-brand">
            {total.toLocaleString()}원
          </span>
        </div>
        <button
          onClick={handleOrder}
          disabled={items.length === 0 || loading}
          className="w-full py-8 bg-brand active:bg-brand-dark text-white text-4xl font-black rounded-3xl disabled:opacity-40 transition-colors flex items-center justify-center gap-4"
        >
          {loading && <Loader2 size={36} className="animate-spin" />}
          {loading ? '주문 중...' : '주문하기'}
        </button>
      </div>
    </div>
  );
}
