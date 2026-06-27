import { Router } from 'express';
import { getUserAchievements, checkAchievements } from '../services/achievementService.js';
import { verifyToken } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const achievements = await getUserAchievements(req.userId!);
    res.json({ achievements });
  } catch (err) {
    console.error('Get achievements error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка' } });
  }
});

// Trigger check (called internally after order creation)
router.post('/check', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { eventType, eventData } = req.body;
    const unlocked = await checkAchievements(req.userId!, eventType, eventData);
    res.json({ unlocked });
  } catch (err) {
    console.error('Check achievements error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка' } });
  }
});

export default router;
