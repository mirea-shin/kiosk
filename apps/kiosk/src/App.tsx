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
  // 연결 끊김 시 exponential backoff로 자동 재연결
  useEffect(() => {
    let ws: WebSocket;
    let retryCount = 0;
    let retryTimer: ReturnType<typeof setTimeout>;
    let unmounted = false;

    const connect = () => {
      const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
      ws = new WebSocket(apiUrl.replace(/^http/, 'ws') + '/ws');

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

      ws.onopen = () => {
        retryCount = 0; // 연결 성공 시 재시도 카운터 초기화
      };

      ws.onclose = () => {
        if (unmounted) return;
        // exponential backoff: 1s → 2s → 4s → 8s → 최대 30s
        const delay = Math.min(1000 * 2 ** retryCount, 30000);
        retryCount++;
        retryTimer = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close(); // onclose에서 재연결 처리
      };
    };

    connect();

    return () => {
      unmounted = true;
      clearTimeout(retryTimer);
      ws?.close();
    };
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
