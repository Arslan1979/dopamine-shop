import { create } from 'zustand';
import type { Transaction, DailyLoginInfo } from '@dopamine-shop/shared-types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface BalanceState {
  balance: number;
  lifetimeEarned: number;
  transactions: Transaction[];
  dailyLogin: DailyLoginInfo | null;
  isLoading: boolean;
  error: string | null;
  // Actions
  fetchBalance: (token: string) => Promise<void>;
  claimDaily: (token: string) => Promise<{ dayStreak: number; coinsEarned: number } | null>;
  deductBalance: (amount: number) => void;
  addBalance: (amount: number) => void;
}

export const useBalanceStore = create<BalanceState>((set, get) => ({
  balance: 0,
  lifetimeEarned: 0,
  transactions: [],
  dailyLogin: null,
  isLoading: false,
  error: null,

  fetchBalance: async (token: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch balance');
      const data = await res.json();
      set({
        balance: data.balance.balance,
        lifetimeEarned: data.balance.lifetimeEarned,
        transactions: data.transactions,
        dailyLogin: data.dailyLogin,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  claimDaily: async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/balance/claim-daily`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to claim daily');
      }
      const data = await res.json();
      // Refresh balance
      await get().fetchBalance(token);
      return { dayStreak: data.dayStreak, coinsEarned: data.coinsEarned };
    } catch (err: any) {
      set({ error: err.message });
      return null;
    }
  },

  deductBalance: (amount: number) => {
    set((state) => ({ balance: Math.max(0, state.balance - amount) }));
  },

  addBalance: (amount: number) => {
    set((state) => ({
      balance: state.balance + amount,
      lifetimeEarned: state.lifetimeEarned + amount,
    }));
  },
}));
