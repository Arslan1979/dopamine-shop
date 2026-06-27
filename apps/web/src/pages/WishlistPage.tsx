import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCartStore } from '../stores/cartStore';
import { Heart, ShoppingCart, Trash2, Sparkles } from 'lucide-react';
import type { Product } from '@dopamine-shop/shared-types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface WishlistItem {
  id: string;
  product: Product;
  addedAt: string;
}

export default function WishlistPage() {
  const { accessToken } = useAuth();
  const addItem = useCartStore((s) => s.addItem);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  async function fetchWishlist() {
    try {
      const res = await fetch(`${API_URL}/wishlist`, {
        headers: { Authorization: `Bearer ${accessToken || ''}` },
      });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const data = await res.json();
      setItems(data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(id: string) {
    try {
      await fetch(`${API_URL}/wishlist/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken || ''}` },
      });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  function moveToCart(productId: string) {
    addItem(productId, 1);
    // Remove from wishlist after adding to cart
    const item = items.find((i) => i.product.id === productId);
    if (item) removeItem(item.id);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Список желаний</h1>
          <p className="text-sm text-slate-500">{items.length} товаров</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ваш список желаний пуст</p>
          <Link to="/catalog" className="text-primary-600 hover:underline text-sm mt-2 inline-block">
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden group">
              <div className="relative aspect-square">
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                <Link to={`/product/${item.product.slug}`}>
                  <h3 className="font-medium text-slate-900 hover:text-primary-600 transition-colors line-clamp-1">
                    {item.product.name}
                  </h3>
                </Link>
                <p className="text-lg font-bold text-slate-900 mt-2">
                  {item.product.price.toLocaleString('ru-RU')} ₽
                </p>
                <button
                  onClick={() => moveToCart(item.product.id)}
                  className="w-full mt-3 flex items-center justify-center gap-2 bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  В корзину
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fake sale notification */}
      {items.length > 0 && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <p className="text-sm text-amber-800">
            <span className="font-medium">Фейковая распродажа!</span> Товары в вашем списке желаний со скидкой 20% (только сегодня, не настоящая)
          </p>
        </div>
      )}
    </div>
  );
}
