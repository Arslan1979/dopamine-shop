import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCartStore } from '../stores/cartStore';
import { useCheckoutStore } from '../stores/checkoutStore';
import PaymentProcessing from '../components/PaymentProcessing';
import type { Order } from '@dopamine-shop/shared-types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function PaymentPage() {
  const { accessToken } = useAuth();
  const { items, clearCart, totalPrice } = useCartStore();
  const { shippingData, deliveryData, clearCheckout } = useCheckoutStore();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!shippingData || !deliveryData || items.length === 0) {
      navigate('/checkout');
      return;
    }

    // Simulate payment processing then create order
    const timer = setTimeout(() => {
      createOrder();
    }, 4000); // Wait for animation stages

    return () => clearTimeout(timer);
  }, []);

  async function createOrder() {
    try {
      const deliveryPrice = deliveryData?.method === 'standard' ? 0 : deliveryData?.method === 'express' ? 499 : 999;

      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify({
          shippingName: shippingData!.name,
          shippingAddress: shippingData!.address,
          shippingCity: shippingData!.city,
          shippingPostalCode: shippingData!.postalCode,
          shippingPhone: shippingData!.phone,
          deliveryMethod: deliveryData!.method,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            price: Number(i.product.price),
          })),
        }),
      });

      if (!res.ok) throw new Error('Order creation failed');
      const data = await res.json();
      setOrder(data);
      setStatus('success');
      clearCart();
      clearCheckout();
    } catch {
      setStatus('error');
    }
  }

  if (status === 'processing') {
    return <PaymentProcessing onComplete={() => {}} onError={() => setStatus('error')} />;
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Что-то пошло не так</h2>
          <p className="text-slate-500 mb-4">Попробуйте оформить заказ снова</p>
          <button
            onClick={() => navigate('/checkout')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Вернуться к оформлению
          </button>
        </div>
      </div>
    );
  }

  if (order) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-lg mx-auto px-4">
          <OrderReceipt order={order} />
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/orders')}
              className="text-primary-600 hover:underline text-sm"
            >
              Перейти к истории заказов →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
