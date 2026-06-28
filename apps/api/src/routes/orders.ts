import { Router } from 'express';
import { z } from 'zod';
import { createOrder, getUserOrders, getOrderById } from '../services/orderService.js';
import { verifyToken } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

const createOrderSchema = z.object({
  shippingName: z.string().min(2).max(50),
  shippingAddress: z.string().min(5).max(200),
  shippingCity: z.string().min(2).max(50),
  shippingPostalCode: z.string().regex(/^\d{6}$/),
  shippingPhone: z.string().regex(/^\+?[0-9]{10,15}$/),
  deliveryMethod: z.enum(['standard', 'express', 'superfast']),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(99),
    price: z.number().positive(),
  })).min(1),
  coinsToSpend: z.number().int().min(0).optional(),
});

router.post('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const parsed = createOrderSchema.safeParse(req.body);
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

    const order = await createOrder({
      userId: req.userId!,
      ...parsed.data,
    });

    res.status(201).json(order);
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка' } });
  }
});

router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

    const result = await getUserOrders(req.userId!, page, limit);
    res.json(result);
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка' } });
  }
});

router.get('/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const order = await getOrderById(req.params.id, req.userId!);
    if (!order) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Заказ не найден' } });
      return;
    }
    res.json(order);
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка' } });
  }
});

export default router;
