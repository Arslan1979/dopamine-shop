import { motion } from 'framer-motion';
import { Flame, Calendar } from 'lucide-react';

interface StreakWidgetProps {
  current: number;
  best: number;
  lastDate?: string | null;
}

export default function StreakWidget({ current, best, lastDate }: StreakWidgetProps) {
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    date.setHours(0, 0, 0, 0);
    return date;
  });

  const lastDateObj = lastDate ? new Date(lastDate) : null;
  if (lastDateObj) lastDateObj.setHours(0, 0, 0, 0);

  const isActive = (date: Date) => {
    if (!lastDateObj) return false;
    const diff = Math.floor((lastDateObj.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff < current;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={current > 0 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Flame className={`w-8 h-8 ${current > 0 ? 'text-orange-500' : 'text-slate-300'}`} />
          </motion.div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{current} дней</p>
            <p className="text-xs text-slate-500">Текущая серия</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">{best}</p>
          <p className="text-xs text-slate-500">Лучшая</p>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-15 gap-1">
        {days.map((day, i) => (
          <div
            key={i}
            className={`w-5 h-5 rounded-sm ${
              isActive(day)
                ? 'bg-green-400'
                : isToday(day)
                ? 'border-2 border-slate-300'
                : 'bg-slate-100'
            }`}
            title={day.toLocaleDateString('ru-RU')}
          />
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-2">Последние 30 дней</p>
    </div>
  );
}
