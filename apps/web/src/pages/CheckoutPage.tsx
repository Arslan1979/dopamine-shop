import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCartStore } from '../stores/cartStore';
import { useCheckoutStore } from '../stores/checkoutStore';
import ShippingForm from '../components/checkout/ShippingForm';
import DeliveryForm from '../components/checkout/DeliveryForm';
import ReviewOrder from '../components/checkout/ReviewOrder';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  { number: 1, label: 'Адрес' },
  { number: 2, label: 'Доставка' },
  { number: 3, label: 'Подтверждение' },
];

export default function CheckoutPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { items, totalItems } = useCartStore();
  const { step, shippingData, deliveryData, setStep, setShippingData, setDeliveryData, setCoinsToSpend } = useCheckoutStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
    if (totalItems === 0) {
      navigate('/catalog');
    }
  }, [isAuthenticated, isLoading, totalItems]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((s, i) => (
            <div key={s.number} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step >= s.number
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {s.number}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-16 sm:w-24 h-0.5 mx-2 transition-colors ${
                    step > s.number ? 'bg-primary-600' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-500 px-1">
          {steps.map((s) => (
            <span key={s.number} className={step >= s.number ? 'text-primary-600 font-medium' : ''}>
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 1 && (
            <ShippingForm
              initialData={shippingData}
              onSubmit={(data) => {
                setShippingData(data);
                setStep(2);
              }}
            />
          )}
          {step === 2 && (
            <DeliveryForm
              initialData={deliveryData}
              onSubmit={(data) => {
                setDeliveryData(data);
                setStep(3);
              }}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && shippingData && deliveryData && (
            <ReviewOrder
              shippingData={shippingData}
              deliveryData={deliveryData}
              onBack={() => setStep(2)}
              onConfirm={(coins) => {
                setCoinsToSpend(coins);
                navigate('/payment');
              }}
              isProcessing={false}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
