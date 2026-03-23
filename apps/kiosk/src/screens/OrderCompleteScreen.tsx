import { useState, useEffect } from 'react';

const AUTO_RETURN_SECONDS = 8;

interface Props {
  orderId: number;
  onDone: () => void;
}

export default function OrderCompleteScreen({ orderId, onDone }: Props) {
  const [countdown, setCountdown] = useState(AUTO_RETURN_SECONDS);

  useEffect(() => {
    if (countdown <= 0) {
      onDone();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onDone]);

  return (
    <div className="w-full h-full bg-brand flex flex-col items-center justify-center text-white select-none">
      {/* 체크 아이콘 */}
      <div className="w-64 h-64 rounded-full bg-white/20 flex items-center justify-center mb-12">
        <svg
          className="w-36 h-36 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-8xl font-black mb-4 tracking-tight">주문 완료!</h1>
      <p className="text-3xl text-white/70 mb-20">접수가 완료되었습니다</p>

      {/* 주문 번호 */}
      <div className="bg-white/20 rounded-3xl px-20 py-10 text-center mb-20">
        <p className="text-2xl text-white/70 mb-3">주문 번호</p>
        <p className="text-9xl font-black tracking-wider">#{orderId}</p>
      </div>

      {/* 카운트다운 */}
      <div className="flex flex-col items-center gap-4">
        <p className="text-2xl text-white/60">
          {countdown}초 후 처음 화면으로 돌아갑니다
        </p>
        <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${(countdown / AUTO_RETURN_SECONDS) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
