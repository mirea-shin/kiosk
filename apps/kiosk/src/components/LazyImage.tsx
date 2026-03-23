import { useState, useCallback } from 'react';

interface Props {
  src: string;
  alt: string;
  className?: string;
}

export default function LazyImage({ src, alt, className }: Props) {
  const [loaded, setLoaded] = useState(false);

  // 이미 브라우저에 캐시된 이미지는 onLoad가 발생하지 않을 수 있으므로
  // ref 콜백으로 img.complete를 즉시 확인
  const imgRef = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete) setLoaded(true);
  }, []);

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-150 ${loaded ? 'opacity-100' : 'opacity-0'} ${className ?? ''}`}
      />
    </div>
  );
}
