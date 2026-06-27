import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Order } from '@dopamine-shop/shared-types';
import { Download, Printer, CheckCircle } from 'lucide-react';

interface OrderReceiptProps {
  order: Order;
}

export default function OrderReceipt({ order }: OrderReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    window.print();
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex gap-2 mb-4 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
        >
          <Printer className="w-4 h-4" />
          Печать
        </button>
      </div>

      <div
        ref={receiptRef}
        className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm print:shadow-none print:border-none"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Чек об оплате</h2>
          <p className="text-sm text-slate-500 mt-1">Заказ #{order.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-xs text-slate-400">{orderDate}</p>
        </div>

        {/* QR */}
        <div className="flex justify-center mb-6">
          <QRCodeSVG
            value={`DOPAMINE:${order.id}:THANKS`}
            size={120}
            level="M"
            includeMargin={true}
          />
        </div>

        {/* Items */}
        <div className="border-t border-slate-100 py-4 space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <div>
                <span className="text-slate-900">{item.productName}</span>
                <span className="text-slate-400 ml-2">× {item.quantity}</span>
              </div>
              <span className="font-medium text-slate-900">
                {(item.priceSnapshot * item.quantity).toLocaleString('ru-RU')} ₽
              </span>
            </div>
          ))}
        </div>

        {/* Delivery */}
        <div className="border-t border-slate-100 py-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Доставка</span>
            <span className="text-slate-900">
              {order.deliveryMethod === 'standard' ? 'Бесплатно' : order.deliveryMethod === 'express' ? '499 ₽' : '999 ₽'}
            </span>
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-slate-100 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-slate-900">Итого</span>
            <span className="text-xl font-bold text-primary-600">
              {order.totalAmount.toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">Спасибо за покупку в DopamineShop!</p>
          <p className="text-xs text-slate-400 mt-1">Это фейковый чек. Никаких реальных денег не списано.</p>
        </div>
      </div>
    </div>
  );
}
