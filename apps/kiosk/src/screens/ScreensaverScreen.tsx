import { useState, useEffect, useRef } from 'react';
import type { ScreensaverMedia } from '@kiosk/shared';

interface Props {
  media: ScreensaverMedia[];
  onWake: () => void;
}

export default function ScreensaverScreen({ media, onWake }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = () => {
    if (media.length > 1) {
      setCurrentIndex((i) => (i + 1) % media.length);
    }
  };

  // media가 교체됐을 때 currentIndex가 범위를 벗어나면 0으로 리셋
  useEffect(() => {
    if (media.length > 0 && currentIndex >= media.length) {
      setCurrentIndex(0);
    }
  }, [media]);

  const current = media[currentIndex];

  // 이미지는 display_duration_seconds 후 다음으로, 영상은 onEnded에서 처리
  useEffect(() => {
    if (!current || current.file_type === 'video') return;
    timerRef.current = setTimeout(advance, current.display_duration_seconds * 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, current]);

  return (
    <div
      className="w-full h-full bg-black flex items-center justify-center cursor-pointer select-none relative"
      onClick={onWake}
    >
      {media.length === 0 ? (
        <IdlePrompt />
      ) : current?.file_type === 'image' ? (
        <img
          key={current.id}
          src={current.url}
          alt=""
          className="w-full h-full object-cover"
          onError={advance}
        />
      ) : (
        <video
          key={current?.id}
          src={current?.url}
          className="w-full h-full object-cover"
          autoPlay
          muted
          playsInline
          onEnded={advance}
          onError={advance}
        />
      )}

      {/* 터치 안내 오버레이 */}
      <div className="absolute bottom-24 left-0 right-0 flex flex-col items-center gap-3 pointer-events-none">
        <div className="w-16 h-16 rounded-full border-4 border-white/60 flex items-center justify-center animate-pulse">
          <div className="w-8 h-8 rounded-full bg-white/60" />
        </div>
        <p className="text-white/70 text-2xl font-medium tracking-widest">
          화면을 터치하여 시작
        </p>
      </div>
    </div>
  );
}

function IdlePrompt() {
  return (
    <div className="flex flex-col items-center gap-8 text-white">
      <p className="text-8xl font-black tracking-tight">KIOSK</p>
      <p className="text-3xl text-white/60 tracking-widest">터치하여 주문 시작</p>
    </div>
  );
}
