import { useCartStore } from '../../stores/cartStore';
import type { ShippingFormData, DeliveryFormData } from '../../lib/validation/checkoutSchema';
import { MapPin, Truck, Package, CreditCard } from 'lucide-react';

interface ReviewOrderProps {
  shippingData: ShippingFormData;
  deliveryData: DeliveryFormData;
  onBack: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

const deliveryNames: Record<string, string> = {
  standard: 'Стандартная доставка (3–5 дней)',
  express: 'Экспресс доставка (1–2 дня)',
  superfast: 'Супер-быстрая доставка (сегодня)',
};

export default function ReviewOrder({ shippingData, deliveryData, onBack, onConfirm, isProcessing }: ReviewOrderProps) {
  const { items, totalPrice } = useCartStore();
  const deliveryPrice = deliveryData.method === 'standard' ? 0 : deliveryData.method === 'express' ? 499 : 999;
  const total = totalPrice + deliveryPrice;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Подтверждение заказа</h2>

      {/* Items */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
          <Package className="w-4 h-4" />
          Товары ({items.length})
        </div>
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <img src={item.product.imageUrl} alt={item.product.name} className="w-12 h-12 object-cover rounded-lg" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{item.product.name}</p>
              <p className="text-xs text-slate-500">{item.quantity} × {item.product.price.toLocaleString('ru-RU')} ₽</p>
            </div>
            <span className="text-sm font-semibold text-slate-900">
              {(item.product.price * item.quantity).toLocaleString('ru-RU')} ₽
            </span>
          </div>
        ))}
      </div>

      {/* Shipping */}
      <div className="bg-slate-50 rounded-xl p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
          <MapPin className="w-4 h-4" />
          Адрес доставки
        </div>
        <p className="text-sm text-slate-600">{shippingData.name}</p>
        <p className="text-sm text-slate-600">{shippingData.address}, {shippingData.city}, {shippingData.postalCode}</p>
        <p className="text-sm text-slate-600">{shippingData.phone}</p>
      </div>

      {/* Delivery */}
      <div className="bg-slate-50 rounded-xl p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
          <Truck className="w-4 h-4" />
          Доставка
        </div>
        <p className="text-sm text-slate-600">{deliveryNames[deliveryData.method]}</p>
      </div>

      {/* Total */}
      <div className="border-t border-slate-200 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Товары</span>
          <span>{totalPrice.toLocaleString('ru-RU')} ₽</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Доставка</span>
          <span>{deliveryPrice === 0 ? 'Бесплатно' : `${deliveryPrice} ₽`}</span>
        </div>
        <div className="flex justify-between text-lg font-bold pt-2">
          <span>Итого</span>
          <span>{total.toLocaleString('ru-RU')} ₽</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          disabled={isProcessing}
          className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Назад
        </button>
        <button
          onClick={onConfirm}
          disabled={isProcessing || items.length === 0}
          className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <CreditCard className="w-4 h-4" />
          {isProcessing ? 'Обработка...' : 'Оплатить'}
        </button>
      </div>
    </div>
  );
}
