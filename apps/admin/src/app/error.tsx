'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="text-red-600" size={28} />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-900">오류가 발생했습니다</h2>
        <p className="mt-1 text-sm text-gray-500">
          {error.message || '페이지를 불러오는 중 문제가 발생했습니다.'}
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-gray-400">#{error.digest}</p>
        )}
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <RefreshCw size={14} />
        다시 시도
      </button>
    </div>
  );
}
