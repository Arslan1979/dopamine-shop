import { useEffect } from 'react';
import { useProductStore } from '../stores/productStore';
import ProductCard from './ProductCard';
import { Loader2 } from 'lucide-react';

interface ProductGridProps {
  onAddToCart?: (productId: string, quantity: number) => void;
}

export default function ProductGrid({ onAddToCart }: ProductGridProps) {
  const { products, loading, error, fetchProducts } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-600">
        <p>{error}</p>
        <button
          onClick={() => fetchProducts()}
          className="mt-4 text-primary-600 hover:underline"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p>Товары не найдены</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
}
