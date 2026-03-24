'use client';
import type { OrderStatus } from '@kiosk/shared';
import { STATUS_TABS } from './order-config';

interface Props {
  selectedStatus: OrderStatus | undefined;
  dateMode: 'today' | 'all';
  countByStatus: (value: OrderStatus | undefined) => number;
  onStatusChange: (status: OrderStatus | undefined) => void;
  onDateModeChange: (mode: 'today' | 'all') => void;
}

export default function OrderFilters({
  selectedStatus,
  dateMode,
  countByStatus,
  onStatusChange,
  onDateModeChange,
}: Props) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
      {/* 상태 필터 — 모바일: select / 데스크탑: 버튼 그룹 */}
      <select
        value={selectedStatus ?? ''}
        onChange={(e) =>
          onStatusChange(e.target.value === '' ? undefined : (e.target.value as OrderStatus))
        }
        className="sm:hidden rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700"
      >
        {STATUS_TABS.map((tab) => (
          <option key={tab.label} value={tab.value ?? ''}>
            {tab.label} ({countByStatus(tab.value)})
          </option>
        ))}
      </select>

      <div className="hidden sm:flex items-center gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => {
          const isActive = selectedStatus === tab.value;
          return (
            <button
              key={tab.label}
              onClick={() => onStatusChange(tab.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`inline-flex items-center justify-center min-w-6 h-5 px-1 rounded-full text-xs tabular-nums ${
                  isActive ? 'bg-green-500 text-green-100' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {countByStatus(tab.value)}
              </span>
            </button>
          );
        })}
      </div>

      {/* 날짜 토글 */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 shrink-0">
        {(['today', 'all'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onDateModeChange(mode)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              dateMode === mode
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {mode === 'today' ? '오늘' : '전체'}
          </button>
        ))}
      </div>
    </div>
  );
}
