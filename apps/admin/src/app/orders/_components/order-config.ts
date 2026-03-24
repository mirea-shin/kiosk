import type { OrderStatus } from '@kiosk/shared';

export const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; dot: string; bg: string; text: string }
> = {
  pending:   { label: '대기중', dot: 'bg-amber-500', bg: 'bg-amber-50',  text: 'text-amber-700' },
  accepted:  { label: '접수',   dot: 'bg-blue-500',  bg: 'bg-blue-50',   text: 'text-blue-700'  },
  preparing: { label: '준비중', dot: 'bg-teal-500',  bg: 'bg-teal-50',   text: 'text-teal-700'  },
  completed: { label: '완료',   dot: 'bg-green-500', bg: 'bg-green-50',  text: 'text-green-700' },
  cancelled: { label: '취소',   dot: 'bg-red-400',   bg: 'bg-red-50',    text: 'text-red-500'   },
};

export const STATUS_TABS: { label: string; value: OrderStatus | undefined }[] = [
  { label: '전체', value: undefined },
  ...(Object.entries(STATUS_CONFIG) as [OrderStatus, (typeof STATUS_CONFIG)[OrderStatus]][]).map(
    ([value, cfg]) => ({ label: cfg.label, value }),
  ),
];

export const ALL_STATUSES = Object.keys(STATUS_CONFIG) as OrderStatus[];
