import { useState } from 'react';
import { deliverySchema, type DeliveryFormData } from '../../lib/validation/checkoutSchema';
import { Truck, Zap, Clock } from 'lucide-react';

interface DeliveryFormProps {
  initialData?: DeliveryFormData | null;
  onSubmit: (data: DeliveryFormData) => void;
  onBack: () => void;
}

const deliveryOptions = [
  {
    id: 'standard',
    name: 'Стандартная доставка',
    description: '3–5 рабочих дней',
    icon: Truck,
    price: 0,
  },
  {
    id: 'express',
    name: 'Экспресс доставка',
    description: '1–2 рабочих дня',
    icon: Zap,
    price: 499,
  },
  {
    id: 'superfast',
    name: 'Супер-быстрая доставка',
    description: 'Сегодня (в пределах МКАД)',
    icon: Clock,
    price: 999,
  },
];

export default function DeliveryForm({ initialData, onSubmit, onBack }: DeliveryFormProps) {
  const [selected, setSelected] = useState(initialData?.method || 'standard');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = deliverySchema.safeParse({ method: selected });
    if (parsed.success) {
      onSubmit(parsed.data);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Способ доставки</h2>

      <div className="space-y-3">
        {deliveryOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.id;
          return (
            <label
              key={option.id}
              className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="delivery"
                value={option.id}
                checked={isSelected}
                onChange={() => setSelected(option.id)}
                className="mt-1 w-4 h-4 text-primary-600"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-primary-600' : 'text-slate-400'}`} />
                  <span className="font-medium text-slate-900">{option.name}</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{option.description}</p>
              </div>
              <span className="font-semibold text-slate-900">
                {option.price === 0 ? 'Бесплатно' : `${option.price} ₽`}
              </span>
            </label>
          );
        })}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
        >
          Назад
        </button>
        <button
          type="submit"
          className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
        >
          Продолжить
        </button>
      </div>
    </form>
  );
}
