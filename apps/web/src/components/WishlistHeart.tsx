import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useWishlistStore } from '../stores/wishlistStore';
import { useAuthStore } from '../stores/authStore';

interface WishlistHeartProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    imageUrl: string;
    category: { id: string; name: string; slug: string };
  };
}

export default function WishlistHeart({ product }: WishlistHeartProps) {
  const token = useAuthStore((s) => s.token);
  const { toggle, isInWishlist } = useWishlistStore();
  const active = isInWishlist(product.id);
  const [animating, setAnimating] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setAnimating(true);
    await toggle(product, token);
    setTimeout(() => setAnimating(false), 300);
  }

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.8 }}
      className="p-2 rounded-full transition-colors bg-white/80 backdrop-blur hover:bg-white"
      aria-label={active ? 'Удалить из избранного' : 'Добавить в избранное'}
    >
      <motion.div
        animate={animating ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Heart
          className={`w-5 h-5 transition-colors ${
            active
              ? 'fill-red-500 text-red-500'
              : 'text-slate-400 hover:text-red-400'
          }`}
        />
      </motion.div>
    </motion.button>
  );
}