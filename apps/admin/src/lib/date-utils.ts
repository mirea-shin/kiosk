/** SQLite 'YYYY-MM-DD HH:MM:SS'와 ISO 문자열 모두 안전하게 파싱 */
function parseDate(dateStr: string): Date {
  if (dateStr.includes('T') || dateStr.endsWith('Z')) {
    return new Date(dateStr);
  }
  // SQLite datetime: 'YYYY-MM-DD HH:MM:SS' → UTC로 명시 변환
  return new Date(dateStr.replace(' ', 'T') + 'Z');
}

/** 한국 시간(KST, UTC+9) 기준 오늘 날짜 'YYYY-MM-DD' */
export function todayKSTDate(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

/** 주문 생성 시각이 KST 기준 오늘인지 확인 */
export function isOrderFromToday(createdAt: string): boolean {
  const kst = new Date(parseDate(createdAt).getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10) === todayKSTDate();
}

/** '방금', 'N분 전' 등 상대 시간 문자열 */
export function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - parseDate(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}개월 전`;
  return `${Math.floor(diff / 31536000)}년 전`;
}

/** '₩1,234' 형식 가격 문자열 */
export function formatPrice(price: number): string {
  return `₩${price.toLocaleString()}`;
}
