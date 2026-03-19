import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <FileQuestion className="text-gray-500" size={28} />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-900">페이지를 찾을 수 없습니다</h2>
        <p className="mt-1 text-sm text-gray-500">요청하신 페이지가 존재하지 않습니다.</p>
      </div>
      <Link
        href="/orders"
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
      >
        주문 목록으로 이동
      </Link>
    </div>
  );
}
