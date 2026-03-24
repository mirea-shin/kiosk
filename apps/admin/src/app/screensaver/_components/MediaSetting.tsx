'use client';

import { useCallback, useRef, useState } from 'react';
import {
  ChevronUp, ChevronDown, ChevronRight,
  ImageIcon, Trash2, Upload, Video,
  MonitorCheck, Plus, X, ArrowUpDown, Clock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ScreensaverChangelog, ScreensaverMedia } from '@kiosk/shared';
import { api } from '@/lib/api-client';
import { timeAgo } from '@/lib/date-utils';
import SectionCard from '@/components/SectionCard';
import SectionHeader from '@/components/SectionHeader';
import Button from '@/components/Button';
import ConfirmDialog from '@/components/ConfirmDialog';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

const FILE_INFO = [
  { icon: ImageIcon, label: '이미지', formats: 'JPG · PNG · GIF · WebP', limit: '최대 10 MB' },
  { icon: Video,     label: '동영상', formats: 'MP4 · WebM · MOV',       limit: '최대 100 MB' },
] as const;

const ACTION_META: Record<
  ScreensaverChangelog['action'],
  { icon: React.ElementType; color: string; label: string }
> = {
  media_upload:   { icon: Plus,        color: 'text-green-500', label: '추가' },
  media_delete:   { icon: X,           color: 'text-red-500',   label: '삭제' },
  media_reorder:  { icon: ArrowUpDown, color: 'text-blue-500',  label: '순서 변경' },
  duration_update:{ icon: Clock,       color: 'text-amber-500', label: '시간 변경' },
};

export default function MediaSetting({
  media,
  hasPendingChanges,
  pendingChanges,
}: {
  media: ScreensaverMedia[];
  hasPendingChanges: boolean;
  pendingChanges: ScreensaverChangelog[];
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [changelogExpanded, setChangelogExpanded] = useState(true);

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setSizeError(null);

      const oversized = Array.from(files).find((file) => {
        const isImage = file.type.startsWith('image/');
        return isImage ? file.size > MAX_IMAGE_SIZE : file.size > MAX_VIDEO_SIZE;
      });

      if (oversized) {
        const isImage = oversized.type.startsWith('image/');
        setSizeError(
          `"${oversized.name}" 파일이 너무 큽니다. ${isImage ? '이미지 최대 10 MB' : '동영상 최대 100 MB'}`,
        );
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setUploadError(null);
      setUploading(true);
      let failed = 0;
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        try {
          await api.upload('/api/screensaver/media', formData);
        } catch {
          failed++;
        }
      }
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (failed > 0) setUploadError(`${failed}개 파일 업로드에 실패했습니다. 다시 시도해주세요.`);
      router.refresh();
    },
    [router],
  );

  const handleDelete = async (id: number) => {
    await api.delete(`/api/screensaver/media/${id}`);
    router.refresh();
  };

  const handleUpdateDuration = async (id: number, seconds: number) => {
    await api.patch(`/api/screensaver/media/${id}`, { display_duration_seconds: seconds });
    router.refresh();
  };

  const handleReorder = async (id: number, direction: 'up' | 'down') => {
    const idx = media.findIndex((m) => m.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= media.length) return;

    const orders = media.map((m) => ({ id: m.id, sort_order: m.sort_order }));
    [orders[idx].sort_order, orders[swapIdx].sort_order] = [orders[swapIdx].sort_order, orders[idx].sort_order];
    await api.put('/api/screensaver/media/reorder', { orders });
    router.refresh();
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await api.post('/api/screensaver/publish', {});
      router.refresh();
    } finally {
      setPublishing(false);
      setShowPublishConfirm(false);
    }
  };

  const publishDialogDescription = (
    <div className="mt-1 space-y-1.5">
      <p className="text-sm text-gray-500">아래 {pendingChanges.length}개 변경사항을 키오스크에 즉시 반영합니다.</p>
      <ul className="mt-2 max-h-40 overflow-y-auto rounded-lg bg-gray-50 px-3 py-2 space-y-1">
        {pendingChanges.map((c) => {
          const meta = ACTION_META[c.action];
          const Icon = meta.icon;
          return (
            <li key={c.id} className="flex items-start gap-2 text-sm">
              <Icon size={13} className={`mt-0.5 shrink-0 ${meta.color}`} />
              <span className="text-gray-700">{c.description}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <>
      <SectionCard>
        <SectionHeader
          icon={<ImageIcon size={20} />}
          title="미디어 파일"
          description="스크린세이버에 표시할 이미지/동영상을 업로드하세요"
          action={
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              <Upload size={14} />
              {uploading ? '업로드 중...' : '미디어 업로드'}
            </Button>
          }
        />

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />

        <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1.5 rounded-lg bg-gray-50 px-4 py-3">
          {FILE_INFO.map(({ icon: Icon, label, formats, limit }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
              <Icon size={13} className="shrink-0 text-gray-400" />
              <span className="font-medium text-gray-600">{label}</span>
              <span>{formats}</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-400">{limit}</span>
            </div>
          ))}
        </div>

        {sizeError && (
          <p className="mb-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{sizeError}</p>
        )}
        {uploadError && (
          <p className="mb-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{uploadError}</p>
        )}

        {media.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">업로드된 미디어가 없습니다</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
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

        {media.length > 0 && (
          <p className="mt-3 text-xs text-gray-400">{media.length}개 파일</p>
        )}

        {hasPendingChanges && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50">
            <button
              onClick={() => setChangelogExpanded((v) => !v)}
              className="flex w-full items-center justify-between gap-4 px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-white">
                  {pendingChanges.length}
                </span>
                <p className="text-sm font-medium text-amber-900">미적용 변경사항이 있습니다</p>
              </div>
              <ChevronRight
                size={16}
                className={`shrink-0 text-amber-600 transition-transform ${changelogExpanded ? 'rotate-90' : ''}`}
              />
            </button>

            {changelogExpanded && (
              <div className="border-t border-amber-200 px-4 pb-3 pt-2">
                <ul className="space-y-2">
                  {pendingChanges.map((change) => {
                    const meta = ACTION_META[change.action];
                    const Icon = meta.icon;
                    return (
                      <li key={change.id} className="flex items-center gap-2.5 text-sm">
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ${meta.color}`}>
                          <Icon size={12} />
                        </span>
                        <span className="flex-1 text-amber-900">{change.description}</span>
                        <span className="shrink-0 text-xs text-amber-500">{timeAgo(change.created_at)}</span>
                      </li>
                    );
                  })}
                </ul>
                <button
                  onClick={() => setShowPublishConfirm(true)}
                  disabled={publishing}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 py-2.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  <MonitorCheck size={15} />
                  키오스크에 적용
                </button>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      <ConfirmDialog
        isOpen={showPublishConfirm}
        title="키오스크에 적용"
        description={publishDialogDescription}
        confirmLabel={publishing ? '적용 중...' : '적용'}
        variant="primary"
        onConfirm={handlePublish}
        onCancel={() => setShowPublishConfirm(false)}
      />
    </>
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

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  const handleSave = () => { onUpdateDuration(item.id, duration); setEditing(false); };
  const handleCancel = () => { setDuration(item.display_duration_seconds); setEditing(false); };

  return (
    <li className="flex items-center gap-4 px-4 py-3">
      <div className="flex shrink-0 flex-col">
        <button
          onClick={() => onReorder(item.id, 'up')}
          disabled={isFirst}
          className="rounded p-0.5 text-gray-300 hover:bg-gray-100 hover:text-gray-500 disabled:opacity-20"
          aria-label="위로"
        >
          <ChevronUp size={16} />
        </button>
        <button
          onClick={() => onReorder(item.id, 'down')}
          disabled={isLast}
          className="rounded p-0.5 text-gray-300 hover:bg-gray-100 hover:text-gray-500 disabled:opacity-20"
          aria-label="아래로"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
        {item.file_type === 'image' ? (
          <img src={item.url} alt={item.original_name} className="h-full w-full object-cover" />
        ) : (
          <Video size={22} className="text-gray-400" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{item.original_name}</p>
        <div className="mt-1 flex items-center gap-2">
          {item.file_type === 'image' ? (
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">이미지</span>
          ) : (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">동영상</span>
          )}
          <span className="text-xs text-gray-400">{formatSize(item.file_size)}</span>
          <span className="text-xs text-gray-400">{formatDate(item.created_at)}</span>
        </div>

        <div className="mt-1.5 flex items-center gap-1">
          {editing ? (
            <>
              <input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-14 rounded border border-gray-300 px-1.5 py-0.5 text-xs outline-none focus:border-green-500"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
              />
              <span className="text-xs text-gray-400">초</span>
              <button onClick={handleSave} className="ml-1 text-xs text-green-600 hover:text-green-700">저장</button>
              <button onClick={handleCancel} className="text-xs text-gray-400 hover:text-gray-600">취소</button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600"
            >
              {duration}초 표시
            </button>
          )}
        </div>
      </div>

      <button
        onClick={() => onDelete(item.id)}
        className="shrink-0 text-red-400 hover:text-red-600"
        aria-label="삭제"
      >
        <Trash2 size={16} />
      </button>
    </li>
  );
}
