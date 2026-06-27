import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface WishlistItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    imageUrl: string;
    category: { id: string; name: string; slug: string };
  };
}

interface WishlistState {
  items: WishlistItem[];
  toggle: (product: WishlistItem['product'], token?: string | null) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      isInWishlist: (productId) => {
        return get().items.some((i) => i.productId === productId);
      },

      toggle: async (product, token) => {
        const exists = get().items.find((i) => i.productId === product.id);

        if (token) {
          // Авторизован — пробуем API
          try {
            const res = await fetch(`${API_URL}/wishlist`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ productId: product.id }),
            });
            if (!res.ok) throw new Error('API error');
            // Перезагружаем список с сервера
            const getRes = await fetch(`${API_URL}/wishlist`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (getRes.ok) {
              const list = await getRes.json();
              set({ items: list.items || [] });
              return;
            }
          } catch {
            // fallback на localStorage
          }
        }

        // Гость или ошибка API — локально
        if (exists) {
          set({ items: get().items.filter((i) => i.productId !== product.id) });
        } else {
          set({
            items: [
              ...get().items,
              { id: crypto.randomUUID(), productId: product.id, product },
            ],
          });
        }
      },
    }),
    {
      name: 'dopamine-wishlist',
      partialize: (state) => ({ items: state.items }),
    }
  )
);