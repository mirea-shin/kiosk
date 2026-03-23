import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { api } from './lib/api';
import { useCartStore } from './stores/cartStore';
import ScreensaverScreen from './screens/ScreensaverScreen';
import MenuScreen from './screens/MenuScreen';
import CartScreen from './screens/CartScreen';
import OrderCompleteScreen from './screens/OrderCompleteScreen';

type Screen = 'screensaver' | 'menu' | 'cart' | 'complete';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5분간 fresh 유지 → 화면 전환 시 불필요한 재fetch 방지
      refetchOnWindowFocus: false,  // 윈도우 포커스 복귀 시 재fetch 안 함 (키오스크 특성상 불필요)
    },
  },
});

function KioskApp() {
  const [screen, setScreen] = useState<Screen>('screensaver');
  const [orderId, setOrderId] = useState<number | null>(null);
  const clear = useCartStore((s) => s.clear);

  const { data: screensaverData } = useQuery({
    queryKey: ['screensaver'],
    queryFn: api.screensaver,
  });

  const { data: branding } = useQuery({
    queryKey: ['branding'],
    queryFn: api.branding,
  });

  useEffect(() => {
    if (branding?.primary_color) {
      document.documentElement.style.setProperty('--brand-primary', branding.primary_color);
    }
  }, [branding]);

  const idleTimeout = (screensaverData?.idle_timeout_seconds ?? 60) * 1000;

  // WebSocket: 어드민에서 "키오스크에 적용" 시 screensaver 데이터 즉시 갱신
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001/ws');
    ws.onmessage = (e) => {
      try {
        const { event } = JSON.parse(e.data);
        if (event === 'screensaver:sync') {
          queryClient.invalidateQueries({ queryKey: ['screensaver'] });
        }
        if (event === 'branding:sync') {
          queryClient.invalidateQueries({ queryKey: ['branding'] });
        }
      } catch {
        // ignore
      }
    };
    return () => ws.close();
  }, []);

  const goToScreensaver = useCallback(() => {
    clear();
    setScreen('screensaver');
  }, [clear]);

  // 유휴 타이머: 스크린세이버가 아닐 때만 동작
  useEffect(() => {
    if (screen === 'screensaver') return;

    let timer: ReturnType<typeof setTimeout>;

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(goToScreensaver, idleTimeout);
    };

    reset();
    window.addEventListener('pointerdown', reset);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', reset);
    };
  }, [screen, idleTimeout, goToScreensaver]);

  return (
    <div className="w-full h-screen overflow-hidden relative bg-black">
      {screen === 'screensaver' && (
        <ScreensaverScreen
          media={screensaverData?.media ?? []}
          onWake={() => setScreen('menu')}
        />
      )}
      {screen === 'menu' && (
        <MenuScreen onGoCart={() => setScreen('cart')} />
      )}
      {screen === 'cart' && (
        <CartScreen
          onBack={() => setScreen('menu')}
          onOrderComplete={(id) => {
            setOrderId(id);
            setScreen('complete');
          }}
        />
      )}
      {screen === 'complete' && (
        <OrderCompleteScreen orderId={orderId!} onDone={goToScreensaver} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <KioskApp />
    </QueryClientProvider>
  );
}
