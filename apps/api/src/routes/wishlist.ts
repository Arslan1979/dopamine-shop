import { Router } from 'express';
import { z } from 'zod';
import { getUserWishlist, toggleWishlistItem, removeWishlistItem } from '../services/wishlistService.js';
import { verifyToken } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const items = await getUserWishlist(req.userId!);
    res.json({ items });
  } catch (err) {
    console.error('Wishlist get error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка' } });
  }
});

router.post('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const schema = z.object({ productId: z.string().uuid() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Неверный productId' } });
      return;
    }

    const result = await toggleWishlistItem(req.userId!, parsed.data.productId);
    res.json(result);
  } catch (err) {
    console.error('Wishlist toggle error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка' } });
  }
});

router.delete('/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    await removeWishlistItem(req.userId!, req.params.id);
    res.status(204).send();
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Не найдено' } });
      return;
    }
    console.error('Wishlist delete error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка' } });
  }
});

export default router;
