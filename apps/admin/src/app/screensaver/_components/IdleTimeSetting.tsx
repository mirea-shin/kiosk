'use client';

import { useState } from 'react';
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import SectionCard from '@/components/SectionCard';
import SectionHeader from '@/components/SectionHeader';
import ConfirmDialog from '@/components/ConfirmDialog';

const MIN_IDLE = 10;
const MAX_IDLE = 3600;

export default function IdleTimeSetting({ value }: { value: number }) {
  const [editedIdleTime, setEditedIdleTime] = useState(value);
  const [showConfirm, setShowConfirm] = useState(false);
  const { status, run } = useAsyncAction();

  const isInvalid = !editedIdleTime || editedIdleTime < MIN_IDLE || editedIdleTime > MAX_IDLE;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isInvalid) return;
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    run(() => api.put('/api/screensaver', { idle_timeout_seconds: editedIdleTime }));
  };

  return (
    <>
      <SectionCard>
        <SectionHeader
          icon={<Clock size={20} />}
          title="대기 시간 설정"
          description="스크린세이버가 표시되기까지 키오스크가 대기하는 시간을 설정합니다"
        />
        <form onSubmit={handleSubmit}>
          <div className="flex items-end gap-4">
            <div className="flex-1 max-w-sm">
              <label className="mb-1.5 block text-sm font-semibold text-gray-900">
                대기 시간 (초)
              </label>
              <input
                type="number"
                min={MIN_IDLE}
                max={MAX_IDLE}
                value={editedIdleTime}
                onChange={(e) => setEditedIdleTime(Number(e.target.value))}
                disabled={status === 'loading'}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-1 disabled:opacity-50 ${
                  isInvalid
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
                    : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
                }`}
              />
              {isInvalid ? (
                <p className="mt-1.5 text-xs text-red-500">{MIN_IDLE}~{MAX_IDLE}초 사이로 입력하세요</p>
              ) : (
                <p className="mt-1.5 text-xs text-gray-400">권장: 30~120초 (범위: {MIN_IDLE}~{MAX_IDLE}초)</p>
              )}
            </div>
            <button
              type="submit"
              disabled={status === 'loading' || isInvalid}
              className="mb-6 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {status === 'loading' && <Loader2 size={15} className="animate-spin" />}
              저장
            </button>
          </div>

          {status === 'success' && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 size={15} />
              대기 시간이 저장되었습니다.
            </div>
          )}
          {status === 'error' && (
            <div className="mt-2 flex items-center gap-2 text-sm text-red-500">
              <XCircle size={15} />
              저장에 실패했습니다. 다시 시도해주세요.
            </div>
          )}
        </form>
      </SectionCard>

      <ConfirmDialog
        isOpen={showConfirm}
        title="대기 시간 변경"
        description={`대기 시간을 ${editedIdleTime}초로 변경합니다. 키오스크에 즉시 반영됩니다.`}
        confirmLabel="저장"
        variant="primary"
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
