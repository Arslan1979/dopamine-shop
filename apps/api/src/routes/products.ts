import { Router } from 'express';
import { z } from 'zod';
import { getProducts, getProductBySlug, getCategories } from '../services/productService.js';

const router = Router();

const productQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  search: z.string().max(100).optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest']).optional().default('newest'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

router.get('/products', async (req, res) => {
  try {
    const parsed = productQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ошибка валидации параметров',
          details: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
        },
      });
      return;
    }

    const result = await getProducts(parsed.data);
    res.json(result);
  } catch (err) {
    console.error('Products error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } });
  }
});

router.get('/products/:slug', async (req, res) => {
  try {
    const result = await getProductBySlug(req.params.slug);
    if (!result) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Товар не найден' } });
      return;
    }
    res.json(result);
  } catch (err) {
    console.error('Product detail error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } });
  }
});

router.get('/categories', async (_req, res) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (err) {
    console.error('Categories error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } });
  }
});

export default router;
