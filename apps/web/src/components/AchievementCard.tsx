import { motion } from 'framer-motion';
import { Lock, Trophy, Star } from 'lucide-react';

interface AchievementCardProps {
  name: string;
  description: string;
  unlocked: boolean;
  progress: number;
  target: number;
  iconUrl?: string;
}

export default function AchievementCard({ name, description, unlocked, progress, target }: AchievementCardProps) {
  const progressPercent = Math.min(100, (progress / target) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative p-4 rounded-xl border-2 transition-all ${
        unlocked
          ? 'border-primary-200 bg-primary-50'
          : 'border-slate-200 bg-slate-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
          unlocked ? 'bg-primary-100 text-primary-600' : 'bg-slate-200 text-slate-400'
        }`}>
          {unlocked ? <Trophy className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-sm ${unlocked ? 'text-primary-900' : 'text-slate-500'}`}>
            {name}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>

          {!unlocked && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>{progress} / {target}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-primary-400 rounded-full"
                />
              </div>
            </div>
          )}

          {unlocked && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span className="text-xs text-primary-600 font-medium">Получено!</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
