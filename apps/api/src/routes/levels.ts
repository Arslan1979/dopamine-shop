import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { getUserLevelData } from '../services/levelService.js';

const router = Router();

// GET /api/level — данные об уровне пользователя
router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const level = await getUserLevelData(req.userId!);
    res.json({ level });
  } catch (err) {
    console.error('Get level error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка' } });
  }
});

export default router;
