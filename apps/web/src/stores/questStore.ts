import { create } from 'zustand';
import type { UserQuest } from '@dopamine-shop/shared-types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface QuestState {
  quests: UserQuest[];
  isLoading: boolean;
  error: string | null;
  fetchQuests: (token: string) => Promise<void>;
  trackAction: (token: string, action: string, count?: number) => Promise<void>;
  claimReward: (token: string, questId: string) => Promise<boolean>;
}

export const useQuestStore = create<QuestState>((set, get) => ({
  quests: [],
  isLoading: false,
  error: null,

  fetchQuests: async (token: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/quests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch quests');
      const data = await res.json();
      set({ quests: data.quests, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  trackAction: async (token: string, action: string, count = 1) => {
    try {
      await fetch(`${API_URL}/quests/track`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, count }),
      });
      // Refresh quests
      await get().fetchQuests(token);
    } catch (err: any) {
      console.error('Track action error:', err);
    }
  },

  claimReward: async (token: string, questId: string) => {
    try {
      const res = await fetch(`${API_URL}/quests/${questId}/claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to claim');
      }
      // Refresh quests
      await get().fetchQuests(token);
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },
}));
