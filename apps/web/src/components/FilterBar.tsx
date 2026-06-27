import { useState, useEffect, useCallback } from 'react';
import { useProductStore } from '../stores/productStore';
import { Search, SlidersHorizontal, X } from 'lucide-react';

export default function FilterBar() {
  const { categories, filters, setFilters } = useProductStore();
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search: searchValue || undefined });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  const activeFiltersCount = [
    filters.categoryId,
    filters.minPrice,
    filters.maxPrice,
    filters.search,
  ].filter(Boolean).length;

  const clearFilters = useCallback(() => {
    setSearchValue('');
    setFilters({ categoryId: undefined, minPrice: undefined, maxPrice: undefined, search: undefined, sort: 'newest' });
  }, [setFilters]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск товаров..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="sm:hidden flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Фильтры
          {activeFiltersCount > 0 && (
            <span className="bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Desktop filters */}
        <div className="hidden sm:flex items-center gap-3">
          <select
            value={filters.categoryId || ''}
            onChange={(e) => setFilters({ categoryId: e.target.value || undefined })}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
          >
            <option value="">Все категории</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={filters.sort || 'newest'}
            onChange={(e) => setFilters({ sort: e.target.value as any })}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
          >
            <option value="newest">Новинки</option>
            <option value="price_asc">Цена: по возрастанию</option>
            <option value="price_desc">Цена: по убыванию</option>
          </select>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-slate-500 hover:text-red-600 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Сбросить
            </button>
          )}
        </div>
      </div>

      {/* Mobile filters accordion */}
      {isMobileOpen && (
        <div className="sm:hidden mt-4 pt-4 border-t border-slate-100 space-y-3">
          <select
            value={filters.categoryId || ''}
            onChange={(e) => setFilters({ categoryId: e.target.value || undefined })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg"
          >
            <option value="">Все категории</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={filters.sort || 'newest'}
            onChange={(e) => setFilters({ sort: e.target.value as any })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg"
          >
            <option value="newest">Новинки</option>
            <option value="price_asc">Цена: по возрастанию</option>
            <option value="price_desc">Цена: по убыванию</option>
          </select>
          {activeFiltersCount > 0 && (
            <button onClick={clearFilters} className="text-sm text-red-600">
              Сбросить все фильтры
            </button>
          )}
        </div>
      )}
    </div>
  );
}
