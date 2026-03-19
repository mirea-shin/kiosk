'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initWebSocket, destroyWebSocket } from '@/lib/websocket-manager';

export default function WebSocketProvider() {
  const router = useRouter();

  useEffect(() => {
    initWebSocket(() => router.refresh());
    return () => destroyWebSocket();
  }, [router]);

  return null;
}
