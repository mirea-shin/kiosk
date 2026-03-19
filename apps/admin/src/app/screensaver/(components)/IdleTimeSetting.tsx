'use client';

import { useState } from 'react';
import { Clock } from 'lucide-react';

import { API_URL } from '@/lib/api';
import SectionCard from '@/components/SectionCard';
import SectionHeader from '@/components/SectionHeader';
import Button from '@/components/Button';

export default function IdleTimeSetting({ value }: { value: number }) {
  const [editedIdleTime, setEditedIdleTime] = useState(value);

  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
    setEditedIdleTime(Number(e.target.value));
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editedIdleTime || editedIdleTime < 0) return;

    await fetch(`${API_URL}/api/screensaver`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idle_timeout_seconds: editedIdleTime }),
    });
  };

  return (
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
              min={0}
              value={editedIdleTime}
              onChange={handleTimeInputChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
            <p className="mt-1.5 text-xs text-gray-400">권장: 30~120초</p>
          </div>
          <Button type="submit" className="mb-6">
            저장
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}
