'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Palette, XCircle } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import SectionCard from '@/components/SectionCard';
import SectionHeader from '@/components/SectionHeader';

const PRESETS = [
  { label: '오렌지', value: '#f97316' },
  { label: '블루',   value: '#3b82f6' },
  { label: '그린',   value: '#22c55e' },
  { label: '레드',   value: '#ef4444' },
  { label: '퍼플',   value: '#a855f7' },
  { label: '핑크',   value: '#ec4899' },
];

const MOCK_MENUS = [
  { name: '불고기 버거', price: '8,500' },
  { name: '치즈 버거',  price: '7,000' },
  { name: '감자튀김',   price: '3,500' },
  { name: '콜라',       price: '2,000' },
];

function KioskMockup({ color }: { color: string }) {
  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0 lg:self-start">
      <p className="text-xs font-medium text-gray-400">화면 미리보기</p>
      <div
        className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-gray-50 shadow-lg flex flex-col"
        style={{ width: 200, height: 360 }}
      >
        <div className="flex-shrink-0 bg-white border-b border-gray-100 flex items-center justify-between px-4 py-2.5">
          <span style={{ fontSize: 13, fontWeight: 900 }} className="text-gray-900">메뉴</span>
          <span style={{ fontSize: 8 }} className="text-gray-400">원하시는 메뉴를 선택하세요</span>
        </div>
        <div className="flex-shrink-0 bg-white border-b border-gray-100 flex gap-1.5 px-2.5 py-1.5">
          <div style={{ backgroundColor: color, fontSize: 8 }} className="rounded-full px-2 py-1 text-white font-semibold whitespace-nowrap">패스트푸드</div>
          <div style={{ fontSize: 8 }} className="rounded-full px-2 py-1 bg-gray-100 text-gray-500 font-semibold whitespace-nowrap">한식</div>
          <div style={{ fontSize: 8 }} className="rounded-full px-2 py-1 bg-gray-100 text-gray-500 font-semibold whitespace-nowrap">음료</div>
        </div>
        <div className="flex-1 p-2 grid grid-cols-2 gap-1.5 overflow-hidden">
          {MOCK_MENUS.map((menu, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-50">
              <div className="bg-gray-100 flex items-center justify-center" style={{ aspectRatio: '4/3', fontSize: 20 }}>🍽️</div>
              <div className="px-1.5 py-1">
                <div style={{ fontSize: 8, fontWeight: 700 }} className="text-gray-900 truncate">{menu.name}</div>
                <div style={{ fontSize: 9, fontWeight: 900, color }} className="mt-0.5">{menu.price}원</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex-shrink-0 bg-gray-900 px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div style={{ backgroundColor: color, width: 17, height: 17, fontSize: 8 }} className="rounded-full text-white flex items-center justify-center font-bold flex-shrink-0">3</div>
            <span style={{ fontSize: 8 }} className="text-white font-semibold">장바구니 보기</span>
          </div>
          <span style={{ color, fontSize: 9 }} className="font-bold whitespace-nowrap">24,000원 →</span>
        </div>
      </div>
      <p style={{ fontSize: 10 }} className="text-gray-300">색상 변경 시 실시간 반영</p>
    </div>
  );
}

export default function BrandingSettings({ primaryColor }: { primaryColor: string }) {
  const [color, setColor] = useState(primaryColor);
  const [hexInput, setHexInput] = useState(primaryColor);
  const { status, run } = useAsyncAction();

  const applyColor = (value: string) => {
    setColor(value);
    setHexInput(value);
  };

  const handleHexInput = (value: string) => {
    setHexInput(value);
    if (/^#[0-9a-fA-F]{6}$/.test(value)) setColor(value);
  };

  const handleSave = () => {
    run(() => api.put('/api/branding', { primary_color: color }));
  };

  const isPreset = PRESETS.some((p) => p.value === color);

  return (
    <SectionCard>
      <SectionHeader
        icon={<Palette size={20} />}
        title="브랜드 색상"
        description="키오스크 UI에 사용되는 주 색상을 설정합니다. 저장 즉시 키오스크에 반영됩니다."
      />

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* 프리셋 */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-700">프리셋</p>
              {isPreset && (
                <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">선택됨</span>
              )}
            </div>
            <div className="flex gap-3 flex-wrap">
              {PRESETS.map((preset) => {
                const active = color === preset.value;
                return (
                  <button
                    key={preset.value}
                    onClick={() => applyColor(preset.value)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 transition-all hover:border-gray-400 ${active ? 'border-gray-800' : 'border-transparent'}`}
                  >
                    <div className="h-8 w-8 rounded-full shadow-sm" style={{ backgroundColor: preset.value }} />
                    <span className="text-xs text-gray-500">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* 커스텀 색상 */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-700">커스텀 색상</p>
              {!isPreset && (
                <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">선택됨</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => applyColor(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded-lg border border-gray-300 p-0.5"
              />
              <input
                type="text"
                value={hexInput}
                onChange={(e) => handleHexInput(e.target.value)}
                placeholder="#f97316"
                maxLength={7}
                className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono text-gray-900 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
              <p className="text-xs text-gray-400">6자리 HEX 코드를 직접 입력할 수 있습니다</p>
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className="flex items-center gap-4 border-t border-gray-100 pt-4">
            <button
              onClick={handleSave}
              disabled={status === 'loading'}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {status === 'loading' && <Loader2 size={15} className="animate-spin" />}
              저장 및 키오스크 적용
            </button>
            {status === 'success' && (
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <CheckCircle2 size={15} />키오스크에 반영되었습니다
              </span>
            )}
            {status === 'error' && (
              <span className="flex items-center gap-1.5 text-sm text-red-500">
                <XCircle size={15} />저장에 실패했습니다
              </span>
            )}
          </div>
        </div>

        <KioskMockup color={color} />
      </div>
    </SectionCard>
  );
}
