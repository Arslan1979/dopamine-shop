import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@dopamine-shop/shared-types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  loading: boolean;
  error: string | null;
  totalItems: number;
  totalPrice: number;
  addItem: (productSlug: string, quantity: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  syncWithServer: (token: string) => Promise<void>;
}

function calculateTotals(items: CartItem[]) {
  return {
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      loading: false,
      error: null,
      totalItems: 0,
      totalPrice: 0,

      addItem: (productSlug, quantity) => {
  const { items } = get();
  // Ищем по slug, т.к. productId в хранилище — UUID от API
  const existing = items.find((i) => i.product.slug === productSlug);

  if (existing) {
    const updated = items.map((i) =>
      i.product.slug === productSlug
        ? { ...i, quantity: Math.min(99, i.quantity + quantity) }
        : i
    );
    set({ items: updated, ...calculateTotals(updated) });
  } else {
    fetch(`${API_URL}/products/${productSlug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Товар не найден');
        return res.json();
      })
      .then((data) => {
        const newItem: CartItem = {
          id: crypto.randomUUID(),
          productId: data.product.id, // UUID для синхронизации с сервером
          quantity,
          product: data.product,
        };
        const updated = [...get().items, newItem];
        set({ items: updated, ...calculateTotals(updated) });
      })
      .catch(() => {});
  }
  set({ isOpen: true });
},

      removeItem: (id) => {
        const updated = get().items.filter((i) => i.id !== id);
        set({ items: updated, ...calculateTotals(updated) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity < 1) {
          get().removeItem(id);
          return;
        }
        const updated = get().items.map((i) =>
          i.id === id ? { ...i, quantity: Math.min(99, quantity) } : i
        );
        set({ items: updated, ...calculateTotals(updated) });
      },

      clearCart: () => set({ items: [], totalItems: 0, totalPrice: 0 }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      syncWithServer: async (token) => {
        try {
          set({ loading: true });
          const { items } = get();
          const res = await fetch(`${API_URL}/cart/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
            }),
          });
          if (!res.ok) throw new Error('Sync failed');
          const data = await res.json();
          set({ items: data.items, ...calculateTotals(data.items) });
        } catch (err: any) {
          set({ error: err.message });
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
  name: 'dopamine-cart',
  partialize: (state) => ({ items: state.items }),
  onRehydrateStorage: () => (state) => {
    if (state && state.items) {
      const totals = calculateTotals(state.items);
      state.totalItems = totals.totalItems;
      state.totalPrice = totals.totalPrice;
    }
  },
}
  )
);
