'use client';
import { API_URL } from '@/lib/api';
import type { ScreensaverMedia } from '@kiosk/shared';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

export default function MediaSetting({ media }: { media: ScreensaverMedia[] }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true);
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        await fetch(`${API_URL}/api/screensaver/media`, {
          method: 'POST',
          body: formData,
        });
      }
      setUploading(false);
      router.refresh();
    },
    [router],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/gif': [],
      'image/webp': [],
      'video/mp4': [],
      'video/webm': [],
      'video/quicktime': [],
    },
  });

  const handleDelete = async (id: number) => {
    await fetch(`${API_URL}/api/screensaver/media/${id}`, { method: 'DELETE' });
    router.refresh();
  };

  const handleUpdateDuration = async (id: number, seconds: number) => {
    await fetch(`${API_URL}/api/screensaver/media/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_duration_seconds: seconds }),
    });
    router.refresh();
  };

  const handleReorder = async (id: number, direction: 'up' | 'down') => {
    const idx = media.findIndex((m) => m.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= media.length) return;

    const orders = media.map((m) => ({ id: m.id, sort_order: m.sort_order }));
    const temp = orders[idx].sort_order;
    orders[idx].sort_order = orders[swapIdx].sort_order;
    orders[swapIdx].sort_order = temp;

    await fetch(`${API_URL}/api/screensaver/media/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders }),
    });
    router.refresh();
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">미디어 파일</h3>
        <p className="text-sm text-gray-500">
          스크린세이버에 표시할 이미지/동영상을 업로드하세요
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <p className="text-gray-500">업로드 중...</p>
        ) : isDragActive ? (
          <p className="text-blue-500">여기에 파일을 놓으세요</p>
        ) : (
          <>
            <p className="text-gray-500">파일을 드래그하거나 클릭하여 선택</p>
            <p className="text-xs text-gray-400 mt-1">JPG · PNG · GIF · WebP · MP4 · WebM · MOV</p>
          </>
        )}
      </div>

      {media.length === 0 ? (
        <p className="mt-4 text-center text-gray-400 text-sm">업로드된 미디어가 없습니다</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {media.map((item, idx) => (
            <MediaItem
              key={item.id}
              item={item}
              isFirst={idx === 0}
              isLast={idx === media.length - 1}
              onDelete={handleDelete}
              onUpdateDuration={handleUpdateDuration}
              onReorder={handleReorder}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function MediaItem({
  item,
  isFirst,
  isLast,
  onDelete,
  onUpdateDuration,
  onReorder,
}: {
  item: ScreensaverMedia;
  isFirst: boolean;
  isLast: boolean;
  onDelete: (id: number) => void;
  onUpdateDuration: (id: number, seconds: number) => void;
  onReorder: (id: number, direction: 'up' | 'down') => void;
}) {
  const [duration, setDuration] = useState(item.display_duration_seconds);
  const [editing, setEditing] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const handleSave = () => {
    onUpdateDuration(item.id, duration);
    setEditing(false);
  };

  const handleCancel = () => {
    setDuration(item.display_duration_seconds);
    setEditing(false);
  };

  return (
    <li className="flex items-center gap-4 p-3 border rounded-lg bg-white">
      <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
        {item.file_type === 'image' ? (
          <img src={item.url} alt={item.original_name} className="w-full h-full object-cover" />
        ) : (
          <video src={item.url} className="w-full h-full object-cover" muted />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.original_name}</p>
        <p className="text-xs text-gray-400">
          {formatSize(item.file_size)} · {item.file_type}
        </p>
        <div className="flex items-center gap-1 mt-1">
          {editing ? (
            <>
              <input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-16 text-xs border rounded px-1 py-0.5"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
              />
              <span className="text-xs text-gray-400">초</span>
              <button
                onClick={handleSave}
                className="text-xs text-blue-500 hover:text-blue-700 ml-1"
              >
                저장
              </button>
              <button
                onClick={handleCancel}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                취소
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2"
            >
              {duration}초 표시
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <button
          onClick={() => onReorder(item.id, 'up')}
          disabled={isFirst}
          className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-20"
        >
          ▲
        </button>
        <button
          onClick={() => onReorder(item.id, 'down')}
          disabled={isLast}
          className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-20"
        >
          ▼
        </button>
      </div>

      <button
        onClick={() => onDelete(item.id)}
        className="text-sm text-red-400 hover:text-red-600 flex-shrink-0"
      >
        삭제
      </button>
    </li>
  );
}
