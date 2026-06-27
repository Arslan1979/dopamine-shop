import type { OrderStatus } from '@dopamine-shop/shared-types';

const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Ожидает', color: 'text-amber-700', bg: 'bg-amber-100' },
  PROCESSING: { label: 'Обрабатывается', color: 'text-blue-700', bg: 'bg-blue-100' },
  SHIPPED: { label: 'В пути', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  DELIVERED: { label: 'Доставлен', color: 'text-green-700', bg: 'bg-green-100' },
  COMPLETED: { label: 'Завершён', color: 'text-slate-700', bg: 'bg-slate-100' },
};

interface StatusBadgeProps {
  status: OrderStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      {config.label}
    </span>
  );
}
