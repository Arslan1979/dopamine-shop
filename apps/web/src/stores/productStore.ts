import { create } from 'zustand';
import type { Product, Category } from '@dopamine-shop/shared-types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface ProductFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest';
}

interface ProductState {
  products: Product[];
  categories: Category[];
  filters: ProductFilters;
  pagination: { page: number; totalPages: number; total: number };
  loading: boolean;
  error: string | null;
  setFilters: (filters: Partial<ProductFilters>) => void;
  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  setPage: (page: number) => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  categories: [],
  filters: { sort: 'newest' },
  pagination: { page: 1, totalPages: 1, total: 0 },
  loading: false,
  error: null,

  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters }, pagination: { ...get().pagination, page: 1 } });
    get().fetchProducts();
  },

  setPage: (page) => {
    set({ pagination: { ...get().pagination, page } });
    get().fetchProducts();
  },

  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const { filters, pagination } = get();
      const params = new URLSearchParams();
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.minPrice) params.append('minPrice', String(filters.minPrice));
      if (filters.maxPrice) params.append('maxPrice', String(filters.maxPrice));
      if (filters.search) params.append('search', filters.search);
      if (filters.sort) params.append('sort', filters.sort);
      params.append('page', String(pagination.page));
      params.append('limit', '20');

      const res = await fetch(`${API_URL}/products?${params.toString()}`);
      if (!res.ok) throw new Error('Ошибка загрузки товаров');
      const data = await res.json();
      set({
        products: data.products,
        pagination: { page: data.page, totalPages: data.totalPages, total: data.total },
      });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchCategories: async () => {
    try {
      const res = await fetch(`${API_URL}/categories`);
      if (!res.ok) throw new Error('Ошибка загрузки категорий');
      const data = await res.json();
      set({ categories: data });
    } catch (err: any) {
      set({ error: err.message });
    }
  },
}));
