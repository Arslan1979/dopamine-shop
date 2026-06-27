import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '@dopamine-shop/shared-types';

interface ProductCardProps {
  product: Product;
  variant?: 'grid' | 'list';
  onAddToCart?: (productId: string, quantity: number) => void;
}

export default function ProductCard({ product, variant = 'grid', onAddToCart }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-xl border border-slate-200 overflow-hidden group ${
        variant === 'list' ? 'flex gap-4' : ''
      }`}
      aria-label={`${product.name}, ${product.price} ₽`}
    >
      <div className={`relative overflow-hidden ${variant === 'list' ? 'w-48 shrink-0' : 'aspect-square'}`}>
        {!imageLoaded && (
          <div className="absolute inset-0 bg-slate-100 animate-pulse" />
        )}
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsWishlisted(!isWishlisted);
          }}
          className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white transition-colors"
          aria-label={isWishlisted ? 'Удалить из избранного' : 'Добавить в избранное'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? 'fill-red-500 text-red-500' : 'text-slate-400'
            }`}
          />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="text-xs text-primary-600 font-medium mb-1">{product.category.name}</div>
        <Link to={`/product/${product.slug}`} className="group/link">
          <h3 className="font-semibold text-slate-900 group-hover/link:text-primary-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{product.description}</p>

        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-slate-900">
            {product.price.toLocaleString('ru-RU')} ₽
          </span>
          <button
            onClick={() => onAddToCart?.(product.id, 1)}
            className="flex items-center gap-1.5 bg-primary-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors active:scale-95"
            aria-label={`Добавить ${product.name} в корзину`}
          >
            <ShoppingCart className="w-4 h-4" />
            В корзину
          </button>
        </div>
      </div>
    </motion.article>
  );
}
