import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Heart, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import type { Product } from '@dopamine-shop/shared-types';
import ProductCard from '../components/ProductCard';
import { useCartStore } from '../stores/cartStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/products/${slug}`);
        if (!res.ok) throw new Error('Товар не найден');
        const data = await res.json();
        setProduct(data.product);
        setRelatedProducts(data.relatedProducts);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Товар не найден'}</p>
          <Link to="/catalog" className="text-primary-600 hover:underline flex items-center gap-1 justify-center">
            <ArrowLeft className="w-4 h-4" />
            Вернуться в каталог
          </Link>
        </div>
      </div>
    );
  }

  const images = [product.imageUrl]; // Single image for now, extendable

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/catalog" className="text-sm text-slate-500 hover:text-primary-600 flex items-center gap-1 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Назад в каталог
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden relative group">
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedImage}
                src={images[selectedImage]}
                alt={product.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full object-cover"
              />
            </AnimatePresence>
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImage((p) => (p - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedImage((p) => (p + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === selectedImage ? 'border-primary-600' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="text-sm text-primary-600 font-medium mb-2">{product.category.name}</div>
            <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
          </div>

          <p className="text-slate-600 leading-relaxed">{product.description}</p>

          {/* Specs */}
          {product.specs && (
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Характеристики</h3>
              <dl className="grid grid-cols-2 gap-3">
                {Object.entries(product.specs as Record<string, string>).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs text-slate-500 capitalize">{key}</dt>
                    <dd className="text-sm font-medium text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="text-3xl font-bold text-slate-900">
            {product.price.toLocaleString('ru-RU')} ₽
          </div>

          {/* Quantity + Actions */}
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-slate-200 rounded-lg">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 py-2 hover:bg-slate-50 transition-colors"
              >
                -
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                className="px-3 py-2 hover:bg-slate-50 transition-colors"
              >
                +
              </button>
            </div>

            <button
              onClick={() => addItem(product.id, quantity)}
              className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors active:scale-[0.98]"
            >
              <ShoppingCart className="w-5 h-5" />
              Добавить в корзину
            </button>

            <button
              onClick={() => setIsWishlisted(!isWishlisted)}
              className={`p-3 border rounded-xl transition-colors ${
                isWishlisted
                  ? 'border-red-200 bg-red-50 text-red-500'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-400'
              }`}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Похожие товары</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
