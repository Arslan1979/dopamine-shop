import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@dopamine-shop/shared-types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string) => void;
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
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'dopamine-auth',
      partialize: (state) => ({ accessToken: state.accessToken }),
    }
  )
);
