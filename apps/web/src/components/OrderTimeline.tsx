import type { OrderStatus } from '@dopamine-shop/shared-types';
import { CheckCircle2, Circle } from 'lucide-react';

const steps: { status: OrderStatus; label: string }[] = [
  { status: 'PENDING', label: 'Принят' },
  { status: 'PROCESSING', label: 'Обработка' },
  { status: 'SHIPPED', label: 'В пути' },
  { status: 'DELIVERED', label: 'Доставлен' },
  { status: 'COMPLETED', label: 'Завершён' },
];

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  createdAt: string;
}

export default function OrderTimeline({ currentStatus, createdAt }: OrderTimelineProps) {
  const currentIndex = steps.findIndex((s) => s.status === currentStatus);

  return (
    <div className="relative">
      {steps.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.status} className="flex items-start gap-4 relative">
            {/* Line */}
            {index < steps.length - 1 && (
              <div
                className={`absolute left-[11px] top-6 w-0.5 h-full ${
                  index < currentIndex ? 'bg-primary-500' : 'bg-slate-200'
                }`}
              />
            )}

            {/* Dot */}
            <div className="relative z-10">
              {isCompleted ? (
                <CheckCircle2 className={`w-6 h-6 ${isCurrent ? 'text-primary-600' : 'text-primary-400'}`} />
              ) : (
                <Circle className="w-6 h-6 text-slate-300" />
              )}
            </div>

            {/* Content */}
            <div className="pb-6 flex-1">
              <p className={`text-sm font-medium ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                {step.label}
              </p>
              {isCurrent && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(createdAt).toLocaleDateString('ru-RU')}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
