import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AchievementToastProps {
  achievement: { name: string; description: string } | null;
  onClose: () => void;
}

export default function AchievementToast({ achievement, onClose }: AchievementToastProps) {
  useEffect(() => {
    if (achievement) {
      // Confetti burst from toast position
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { x: 0.8, y: 0.8 },
        colors: ['#f59e0b', '#ec4899', '#6366f1', '#10b981'],
      });

      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievement]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ x: 120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 120, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-4 right-4 z-50 bg-white border border-amber-200 rounded-xl shadow-xl p-4 max-w-sm"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-0.5">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span className="text-xs font-medium text-amber-600">Достижение разблокировано!</span>
              </div>
              <h4 className="font-semibold text-slate-900 text-sm">{achievement.name}</h4>
              <p className="text-xs text-slate-500">{achievement.description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
