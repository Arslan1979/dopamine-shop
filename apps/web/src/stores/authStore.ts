import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserBalance, UserLevel } from '@dopamine-shop/shared-types';

interface ExtendedUser extends User {
  balance?: UserBalance;
  level?: UserLevel;
}

interface AuthState {
  user: ExtendedUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: ExtendedUser, accessToken: string) => void;
  updateBalance: (balance: UserBalance) => void;
  updateLevel: (level: UserLevel) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true, isLoading: false }),
      updateBalance: (balance) =>
        set((state) => ({ user: state.user ? { ...state.user, balance } : null })),
      updateLevel: (level) =>
        set((state) => ({ user: state.user ? { ...state.user, level } : null })),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'dopamine-auth',
      partialize: (state) => ({ accessToken: state.accessToken }),
    }
  )
);
