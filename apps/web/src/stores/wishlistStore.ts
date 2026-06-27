import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface WishlistItem {
  id: string;
  productId: string;
  product: { id: string; name: string; slug: string; price: number; imageUrl: string };
}

interface WishlistState {
  items: WishlistItem[];
  loading: boolean;
  toggleItem: (productId: string, token?: string) => Promise<void>;
  fetchItems: (token: string) => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,

      toggleItem: async (productId, token) => {
        try {
          const res = await fetch(`${API_URL}/wishlist`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ productId }),
          });
          if (!res.ok) throw new Error('Wishlist toggle failed');
          const data = await res.json();
          set({ items: data.items || [] });
        } catch {
          // fallback: toggle locally if not logged in
          const exists = get().items.find((i) => i.productId === productId);
          if (exists) {
            set({ items: get().items.filter((i) => i.productId !== productId) });
          } else {
            // fetch minimal product info for local storage
            const pres = await fetch(`${API_URL}/products/${productId}`);
            if (pres.ok) {
              const pdata = await pres.json();
              const newItem: WishlistItem = {
                id: crypto.randomUUID(),
                productId: pdata.product.id,
                product: pdata.product,
              };
              set({ items: [...get().items, newItem] });
            }
          }
        }
      },

      fetchItems: async (token) => {
        try {
          const res = await fetch(`${API_URL}/wishlist`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error('Failed to fetch wishlist');
          const data = await res.json();
          set({ items: data.items || [] });
        } catch {
          // leave local items
        }
      },
    }),
    {
      name: 'dopamine-wishlist',
      partialize: (state) => ({ items: state.items }),
    }
  )
);