import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { api } from './lib/api';
import { useCartStore } from './stores/cartStore';
import ScreensaverScreen from './screens/ScreensaverScreen';
import MenuScreen from './screens/MenuScreen';
import CartScreen from './screens/CartScreen';
import OrderCompleteScreen from './screens/OrderCompleteScreen';

type Screen = 'screensaver' | 'menu' | 'cart' | 'complete';

const queryClient = new QueryClient();

function KioskApp() {
  const [screen, setScreen] = useState<Screen>('screensaver');
  const [orderId, setOrderId] = useState<number | null>(null);
  const clear = useCartStore((s) => s.clear);

  const { data: screensaverData } = useQuery({
    queryKey: ['screensaver'],
    queryFn: api.screensaver,
  });

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
