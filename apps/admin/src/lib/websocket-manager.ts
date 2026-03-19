import { useNotificationStore } from './stores/notifications';
import { debounce } from './debounce';

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let refreshFn: (() => void) | null = null;

// 메시지가 연달아 와도 500ms 내 마지막 것만, 최대 2초마다 1회 보장
const debouncedRefresh = debounce(() => refreshFn?.(), 500, 2000);

function connect() {
  if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) return;

  ws = new WebSocket('ws://localhost:3001/ws');

  ws.onmessage = (e) => {
    try {
      const { event } = JSON.parse(e.data) as { event: string };
      const { addOrMergeToast } = useNotificationStore.getState();

      if (event === 'order:created') {
        addOrMergeToast(event, '새 주문이 들어왔습니다');
        debouncedRefresh();
      } else if (event === 'order:updated') {
        debouncedRefresh();
      }
    } catch {
      // 파싱 실패는 무시
    }
  };

  ws.onclose = () => {
    ws = null;
    reconnectTimer = setTimeout(connect, 3000); // 3초 후 재연결
  };

  ws.onerror = () => ws?.close();
}

export function initWebSocket(onRefresh: () => void) {
  refreshFn = onRefresh;
  connect();
}

export function destroyWebSocket() {
  refreshFn = null;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  ws?.close();
  ws = null;
}
