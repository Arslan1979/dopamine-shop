import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

interface WishlistHeartProps {
  productId: string;
  initialActive?: boolean;
  onToggle?: (active: boolean) => void;
}

export default function WishlistHeart({ productId, initialActive = false, onToggle }: WishlistHeartProps) {
  const [active, setActive] = useState(initialActive);
  const [animating, setAnimating] = useState(false);

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    setAnimating(true);
    setActive(!active);

    // API call would go here in real implementation
    // For now, just toggle locally
    onToggle?.(!active);

    setTimeout(() => setAnimating(false), 300);
  }

  return (
    <motion.button
      onClick={handleToggle}
      whileTap={{ scale: 0.8 }}
      className="p-2 rounded-full transition-colors"
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
