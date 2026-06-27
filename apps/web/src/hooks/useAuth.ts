import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function useAuth() {
  const { user, accessToken, isAuthenticated, isLoading, setAuth, logout, setLoading } = useAuthStore();

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    // Validate token on mount
    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setAuth(data.user, accessToken);
        } else if (res.status === 401) {
          // Try refresh
          await refreshToken();
        }
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, []);

  async function refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      logout();
      return;
    }
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (res.ok) {
        const data = await res.json();
        setAuth(user!, data.accessToken); // user will be re-fetched by me endpoint
        localStorage.setItem('refreshToken', data.refreshToken);
      } else {
        logout();
      }
    } catch {
      logout();
    }
  }

  async function login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Ошибка входа');
    setAuth(data.user, data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
  }

  async function register(email: string, password: string, name: string) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Ошибка регистрации');
    setAuth(data.user, data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
  }

  function handleLogout() {
    localStorage.removeItem('refreshToken');
    logout();
  }

  return { user, isAuthenticated, isLoading, login, register, logout: handleLogout };
}
