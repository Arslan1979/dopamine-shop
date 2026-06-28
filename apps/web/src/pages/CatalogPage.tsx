import { useEffect } from 'react';
import { useProductStore } from '../stores/productStore';
import { useCartStore } from '../stores/cartStore';
import { useQuestStore } from '../stores/questStore';
import { useAuth } from '../hooks/useAuth';
import ProductGrid from '../components/ProductGrid';
import FilterBar from '../components/FilterBar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CatalogPage() {
  const { pagination, fetchCategories, setPage } = useProductStore();
  const addItem = useCartStore((s) => s.addItem);
  const { trackAction } = useQuestStore();
  const { isAuthenticated, accessToken } = useAuth();

  useEffect(() => {
    fetchCategories();
    if (isAuthenticated && accessToken) {
      trackAction(accessToken, 'visit_catalog');
    }
  }, [isAuthenticated, accessToken]);

  const handleAddToCart = (productId: string, quantity: number) => {
    addItem(productId, quantity);
    if (isAuthenticated && accessToken) {
      trackAction(accessToken, 'add_to_cart');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Каталог товаров</h1>
      <FilterBar />
      <ProductGrid onAddToCart={handleAddToCart} />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(Math.max(1, pagination.page - 1))}
            disabled={pagination.page === 1}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-600">
            Страница {pagination.page} из {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(pagination.totalPages, pagination.page + 1))}
            disabled={pagination.page === pagination.totalPages}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
