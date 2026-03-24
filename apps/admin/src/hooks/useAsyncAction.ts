import { useState } from 'react';

type Status = 'idle' | 'loading' | 'success' | 'error';

/**
 * 비동기 액션의 로딩/성공/에러 상태를 관리하는 훅.
 * 성공/에러 후 3초 뒤 idle로 자동 초기화됩니다.
 */
export function useAsyncAction() {
  const [status, setStatus] = useState<Status>('idle');

  const run = async (action: () => Promise<void>) => {
    setStatus('loading');
    try {
      await action();
      setStatus('success');
    } catch {
      setStatus('error');
    } finally {
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return { status, run };
}
