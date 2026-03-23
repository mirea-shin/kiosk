'use client';
import React from 'react';
import { ImageIcon, Pencil, Trash2 } from 'lucide-react';

export default function MenuCard({
  name,
  description,
  price,
  is_available,
  image_url,
  handleEditMenu,
  handleDeleteMenu,
  handleToggleAvailable,
  isDragging = false,
}: {
  id: number;
  name: string;
  description: string;
  price: number;
  is_available: boolean;
  image_url: string | null;
  handleEditMenu: () => void;
  handleDeleteMenu: () => void;
  handleToggleAvailable: () => void;
  isDragging?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${
        isDragging
          ? 'border-green-400 shadow-lg ring-2 ring-green-300'
          : 'border-gray-200'
      }`}
    >
      {/* Content */}
      <div className="flex gap-3 p-4">
        {/* Image placeholder */}
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gray-100">
          {image_url ? (
            <img src={image_url} alt={name} className="h-full w-full rounded-xl object-cover" />
          ) : (
            <ImageIcon size={28} className="text-gray-400" />
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col min-w-0">
          <div className="mb-1 flex items-start justify-between gap-2">
            <h4 className="font-bold text-gray-900 leading-tight">{name}</h4>
            <label className="inline-flex shrink-0 cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={is_available}
                onChange={handleToggleAvailable}
              />
              <div className="relative h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-green-500 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all after:content-[''] peer-checked:after:translate-x-5" />
            </label>
          </div>
          <p className="mb-3 text-xs text-gray-500 line-clamp-2">{description}</p>
          <div className="mt-auto flex items-center justify-between">
            <span className="font-bold text-green-600">₩{price?.toLocaleString()}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleEditMenu}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={handleDeleteMenu}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
