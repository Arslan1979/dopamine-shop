import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@dopamine-shop/database';
import { verifyToken } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

const syncSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(99),
  })),
});

router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.userId! },
      include: { product: { include: { category: { select: { id: true, name: true, slug: true } } } } },
    });
    res.json({
      items,
      totalItems: items.reduce((s, i) => s + i.quantity, 0),
      totalPrice: items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0),
    });
  } catch (err) {
    console.error('Cart get error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка' } });
  }
});

router.post('/sync', verifyToken, async (req: AuthRequest, res) => {
  try {
    const parsed = syncSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ошибка валидации',
          details: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
        },
      });
      return;
    }

    const userId = req.userId!;
    const { items } = parsed.data;

    // Atomic: delete existing, insert new
    await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { userId } });
      for (const item of items) {
        await tx.cartItem.create({
          data: { userId, productId: item.productId, quantity: item.quantity },
        });
      }
    });

    const updated = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: { include: { category: { select: { id: true, name: true, slug: true } } } } },
    });

    res.json({
      items: updated,
      totalItems: updated.reduce((s, i) => s + i.quantity, 0),
      totalPrice: updated.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0),
    });
  } catch (err) {
    console.error('Cart sync error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка' } });
  }
});

export default router;
