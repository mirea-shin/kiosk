import { useNotificationStore } from './stores/notifications';
import { debounce } from './debounce';

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

const subscribers = new Set<() => void>();

const debouncedNotify = debounce(() => {
  subscribers.forEach((fn) => fn());
}, 500, 2000);

function connect() {
  if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) return;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  ws = new WebSocket(apiUrl.replace(/^http/, 'ws') + '/ws');

  ws.onmessage = (e) => {
    try {
      const { event } = JSON.parse(e.data) as { event: string };
      const { addOrMergeToast } = useNotificationStore.getState();

      if (event === 'order:created') {
        addOrMergeToast(event, '새 주문이 들어왔습니다');
        debouncedNotify();
      } else if (event === 'order:status_changed') {
        debouncedNotify();
      }
    } catch {
      // 파싱 실패는 무시
    }
  };

  ws.onclose = () => {
    ws = null;
    reconnectTimer = setTimeout(connect, 3000);
  };

  ws.onerror = () => ws?.close();
}

export function addRefreshSubscriber(fn: () => void) {
  subscribers.add(fn);
  connect();
}

export function removeRefreshSubscriber(fn: () => void) {
  subscribers.delete(fn);
}

export function initWebSocket(onRefresh: () => void) {
  addRefreshSubscriber(onRefresh);
}

export function destroyWebSocket() {
  subscribers.clear();
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  ws?.close();
  ws = null;
}
