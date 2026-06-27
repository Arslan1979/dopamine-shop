import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentProcessingProps {
  onComplete: () => void;
  onError: () => void;
}

type Stage = 'connecting' | 'verifying' | 'success' | 'error';

const stages: { id: Stage; label: string; duration: number }[] = [
  { id: 'connecting', label: 'Подключение к банку...', duration: 1500 },
  { id: 'verifying', label: 'Проверка данных...', duration: 1500 },
  { id: 'success', label: 'Успешно!', duration: 1000 },
];

export default function PaymentProcessing({ onComplete, onError }: PaymentProcessingProps) {
  const [stage, setStage] = useState<Stage>('connecting');
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (stageIndex < stages.length) {
      const timer = setTimeout(() => {
        const nextIndex = stageIndex + 1;
        if (nextIndex < stages.length) {
          setStageIndex(nextIndex);
          setStage(stages[nextIndex].id);
        }
      }, stages[stageIndex].duration);
      return () => clearTimeout(timer);
    } else {
      // All stages complete — trigger confetti and callback
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#ec4899', '#f59e0b', '#10b981'],
      });
      const timer = setTimeout(onComplete, 500);
      return () => clearTimeout(timer);
    }
  }, [stageIndex]);

  return (
    <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center">
      <div className="text-center">
        <AnimatePresence mode="wait">
          {stage !== 'success' && stage !== 'error' && (
            <motion.div
              key={stage}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-6"
            >
              <div className="relative w-20 h-20 mx-auto">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-full h-full border-4 border-primary-200 border-t-primary-600 rounded-full"
                />
              </div>
              <p className="text-white text-lg font-medium">{stages[stageIndex]?.label}</p>
            </motion.div>
          )}

          {stage === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="space-y-4"
            >
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Оплата прошла!</h2>
              <p className="text-slate-300">Ваш заказ оформлен. Спасибо за покупку!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
