import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import StatusBadge from '../components/StatusBadge';
import OrderTimeline from '../components/OrderTimeline';
import { ArrowLeft, Package, MapPin } from 'lucide-react';
import type { Order } from '@dopamine-shop/shared-types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchOrder();
  }, [id]);

  async function fetchOrder() {
    try {
      const res = await fetch(`${API_URL}/orders/${id}`, {
        headers: { Authorization: `Bearer ${accessToken || ''}` },
      });
      if (!res.ok) throw new Error('Заказ не найден');
      const data = await res.json();
      setOrder(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Заказ не найден'}</p>
          <Link to="/orders" className="text-primary-600 hover:underline">
            ← Назад к заказам
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/orders" className="text-sm text-slate-500 hover:text-primary-600 flex items-center gap-1 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Назад к заказам
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Заказ #{order.id.slice(0, 8).toUpperCase()}
        </h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Статус доставки</h2>
          <OrderTimeline currentStatus={order.status} createdAt={order.createdAt} />
        </div>

        {/* Details */}
        <div className="space-y-4">
          {/* Items */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-slate-900">Товары</h2>
            </div>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{item.productName}</p>
                    <p className="text-xs text-slate-500">
                      {item.quantity} × {item.priceSnapshot.toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {(item.priceSnapshot * item.quantity).toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 mt-4 pt-4 flex justify-between">
              <span className="font-bold text-slate-900">Итого</span>
              <span className="font-bold text-primary-600">
                {order.totalAmount.toLocaleString('ru-RU')} ₽
              </span>
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-slate-900">Адрес доставки</h2>
            </div>
            <p className="text-sm text-slate-600">{order.shippingName}</p>
            <p className="text-sm text-slate-600">
              {order.shippingAddress}, {order.shippingCity}, {order.shippingPostalCode}
            </p>
            <p className="text-sm text-slate-600">{order.shippingPhone}</p>
            <p className="text-sm text-slate-500 mt-2">
              Способ: {order.deliveryMethod === 'standard' ? 'Стандартная' : order.deliveryMethod === 'express' ? 'Экспресс' : 'Супер-быстрая'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
