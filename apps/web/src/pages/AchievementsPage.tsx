import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import AchievementCard from '../components/AchievementCard';
import StreakWidget from '../components/StreakWidget';
import AchievementToast from '../components/AchievementToast';
import { Trophy } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  target: number;
}

interface StreakData {
  current: number;
  best: number;
  lastDate: string | null;
}

export default function AchievementsPage() {
  const { accessToken } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [streak, setStreak] = useState<StreakData>({ current: 0, best: 0, lastDate: null });
  const [loading, setLoading] = useState(true);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    fetchAchievements();
  }, []);

  async function fetchAchievements() {
    try {
      const res = await fetch(`${API_URL}/achievements`, {
        headers: { Authorization: `Bearer ${accessToken || ''}` },
      });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const data = await res.json();
      setAchievements(data.achievements);

      // Check for newly unlocked
      const newlyUnlocked = data.achievements.find((a: Achievement) => a.unlocked && !a.unlockedAt);
      if (newlyUnlocked) {
        setNewAchievement(newlyUnlocked);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <Trophy className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Достижения</h1>
          <p className="text-sm text-slate-500">
            {unlockedCount} из {totalCount} разблокировано
          </p>
        </div>
      </div>

      {/* Streak */}
      <div className="mb-8">
        <StreakWidget current={streak.current} best={streak.best} lastDate={streak.lastDate} />
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-600">Прогресс</span>
          <span className="font-medium text-slate-900">
            {Math.round((unlockedCount / totalCount) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Achievements grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {achievements.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            name={achievement.name}
            description={achievement.description}
            unlocked={achievement.unlocked}
            progress={achievement.progress}
            target={achievement.target}
            iconUrl={achievement.iconUrl}
          />
        ))}
      </div>

      <AchievementToast
        achievement={newAchievement ? { name: newAchievement.name, description: newAchievement.description } : null}
        onClose={() => setNewAchievement(null)}
      />
    </div>
  );
}
