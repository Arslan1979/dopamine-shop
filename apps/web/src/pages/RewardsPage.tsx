import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useBalanceStore } from '../stores/balanceStore';
import { useQuestStore } from '../stores/questStore';
import { useAuthStore } from '../stores/authStore';
import {
  Coins,
  Trophy,
  Target,
  Calendar,
  Sparkles,
  CheckCircle2,
  Circle,
  Gift,
  TrendingUp,
  Zap,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function RewardsPage() {
  const { isAuthenticated, accessToken } = useAuth();
  const { user } = useAuthStore();
  const { balance, lifetimeEarned, dailyLogin, fetchBalance, claimDaily } = useBalanceStore();
  const { quests, fetchQuests, claimReward, trackAction } = useQuestStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'quests' | 'history'>('overview');
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimedQuest, setClaimedQuest] = useState<{ name: string; coins: number; xp: number } | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchBalance(accessToken);
      fetchQuests(accessToken);
      fetchTransactions();
    }
  }, [isAuthenticated, accessToken]);

  // Track page visit
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      trackAction(accessToken, 'visit_achievements');
    }
  }, []);

  async function fetchTransactions() {
    try {
      const res = await fetch(`${API_URL}/balance`, {
        headers: { Authorization: `Bearer ${accessToken || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleClaimDaily() {
    if (!accessToken) return;
    setClaiming('daily');
    const result = await claimDaily(accessToken);
    if (result) {
      // Refresh user data
      const meRes = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        useAuthStore.getState().setAuth(meData.user, accessToken);
      }
    }
    setClaiming(null);
  }

  async function handleClaimQuest(questId: string, questName: string, rewardCoins: number, rewardXP: number) {
    if (!accessToken) return;
    setClaiming(questId);
    const success = await claimReward(accessToken, questId);
    if (success) {
      setClaimedQuest({ name: questName, coins: rewardCoins, xp: rewardXP });
      setTimeout(() => setClaimedQuest(null), 3000);
      // Refresh user data
      const meRes = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        useAuthStore.getState().setAuth(meData.user, accessToken);
      }
    }
    setClaiming(null);
  }

  const completedQuests = quests.filter((q) => q.completed).length;
  const claimableQuests = quests.filter((q) => q.completed && !q.claimed).length;
  const level = user?.level;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Награды</h1>
          <p className="text-sm text-slate-500">Монеты, уровни и ежедневные задания</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{balance}</p>
            <p className="text-xs text-slate-500">Монет</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{level?.levelTitle || 'Bronze'}</p>
            <p className="text-xs text-slate-500">Уровень {level?.level || 1}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
            <Target className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{completedQuests}/{quests.length}</p>
            <p className="text-xs text-slate-500">Заданий выполнено</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        {[
          { key: 'overview', label: 'Обзор', icon: TrendingUp },
          { key: 'quests', label: 'Задания', icon: Target },
          { key: 'history', label: 'История', icon: Calendar },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.key === 'quests' && claimableQuests > 0 && (
              <span className="bg-primary-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {claimableQuests}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Level Progress */}
          {level && (
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Уровень {level.levelTitle}</h3>
                  <p className="text-sm text-slate-500">{level.experience} XP</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">До следующего уровня</p>
                  <p className="text-sm font-medium text-slate-900">
                    {level.nextLevelXP - level.experience} XP
                  </p>
                </div>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${level.progress}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full"
                />
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">{level.progress}% прогресса</p>
            </div>
          )}

          {/* Daily Login */}
          {dailyLogin && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Gift className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-900">Ежедневный бонус</h3>
                    <p className="text-sm text-amber-700">
                      {dailyLogin.canClaimToday
                        ? `Получите ${dailyLogin.nextDailyReward} монет!`
                        : `Возвращайтесь завтра за ${dailyLogin.nextDailyReward} монет`
                      }
                    </p>
                    {!dailyLogin.canClaimToday && (
                      <p className="text-xs text-amber-600 mt-1">Стрик: {dailyLogin.dayStreak} дней</p>
                    )}
                  </div>
                </div>
                {dailyLogin.canClaimToday && (
                  <button
                    onClick={handleClaimDaily}
                    disabled={claiming === 'daily'}
                    className="px-5 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {claiming === 'daily' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    Забрать
                  </button>
                )}
              </div>
              {/* Streak visualization */}
              <div className="flex gap-2 mt-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-full ${
                      i < (dailyLogin.dayStreak % 7 || 7)
                        ? 'bg-amber-400'
                        : 'bg-amber-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quests Tab */}
      {activeTab === 'quests' && (
        <div className="space-y-4">
          {quests.length === 0 ? (
            <div className="text-center py-12 text-slate-500">Задания загружаются...</div>
          ) : (
            quests.map((userQuest) => {
              const IconComponent = getIconComponent(userQuest.quest.icon);
              return (
                <div
                  key={userQuest.id}
                  className={`bg-white border rounded-xl p-4 flex items-center gap-4 transition-all ${
                    userQuest.completed
                      ? userQuest.claimed
                        ? 'border-green-200 bg-green-50/50'
                        : 'border-primary-300 bg-primary-50/30'
                      : 'border-slate-200'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      userQuest.completed
                        ? userQuest.claimed
                          ? 'bg-green-100'
                          : 'bg-primary-100'
                        : 'bg-slate-100'
                    }`}
                  >
                    {userQuest.completed && userQuest.claimed ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <IconComponent className="w-6 h-6 text-slate-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900">{userQuest.quest.name}</h4>
                    <p className="text-xs text-slate-500">{userQuest.quest.description}</p>
                    {!userQuest.completed && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full transition-all"
                            style={{ width: `${(userQuest.progress / userQuest.target) * 100}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {userQuest.progress}/{userQuest.target}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-xs text-amber-600">
                      <Coins className="w-3 h-3" />
                      <span>+{userQuest.quest.rewardCoins}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-purple-600">
                      <Zap className="w-3 h-3" />
                      <span>+{userQuest.quest.rewardXP} XP</span>
                    </div>
                    {userQuest.completed && !userQuest.claimed && (
                      <button
                        onClick={() =>
                          handleClaimQuest(
                            userQuest.questId,
                            userQuest.quest.name,
                            userQuest.quest.rewardCoins,
                            userQuest.quest.rewardXP
                          )
                        }
                        disabled={claiming === userQuest.questId}
                        className="mt-2 px-3 py-1 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                      >
                        {claiming === userQuest.questId ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          'Забрать'
                        )}
                      </button>
                    )}
                    {userQuest.claimed && (
                      <span className="text-xs text-green-600 font-medium">Получено</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">Нет транзакций</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-900">{tx.description}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(tx.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      tx.amount > 0 ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Claimed Quest Toast */}
      <AnimatePresence>
        {claimedQuest && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 bg-white border border-green-200 shadow-lg rounded-xl p-4 flex items-center gap-3 z-50"
          >
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Награда получена!</p>
              <p className="text-xs text-slate-500">
                +{claimedQuest.coins} монет, +{claimedQuest.xp} XP
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper to map icon names to Lucide components
function getIconComponent(iconName: string) {
  const iconMap: Record<string, React.ComponentType<any>> = {
    Search,
    Eye,
    ShoppingCart,
    Heart,
    Package,
    Trophy,
    Star,
    Target,
  };
  return iconMap[iconName] || Star;
}

// Import needed icons
import {
  Search,
  Eye,
  ShoppingCart,
  Package,
  Star,
  XCircle,
} from 'lucide-react';
