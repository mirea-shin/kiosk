import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT = {
  danger: {
    icon: 'bg-red-100',
    iconColor: 'text-red-500',
    btn: 'bg-red-500 hover:bg-red-600',
  },
  primary: {
    icon: 'bg-green-100',
    iconColor: 'text-green-600',
    btn: 'bg-green-600 hover:bg-green-700',
  },
};

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = '삭제',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const v = VARIANT[variant];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
      <div className="w-80 rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex flex-col items-center gap-3 text-center">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${v.icon}`}>
            <AlertTriangle size={22} className={v.iconColor} />
          </div>
          <div>
            <p className="font-bold text-gray-900">{title}</p>
            {description && (
              <div className="mt-1 text-sm text-gray-500">{description}</div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium text-white ${v.btn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
