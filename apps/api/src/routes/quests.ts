import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import {
  getOrCreateDailyQuests,
  trackQuestProgress,
  claimQuestReward,
} from '../services/questService.js';

const router = Router();

// GET /api/quests — получить сегодняшние задания
router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const userQuests = await getOrCreateDailyQuests(req.userId!);

    const quests = userQuests.map((uq) => ({
      id: uq.id,
      questId: uq.questId,
      quest: {
        id: uq.quest.id,
        slug: uq.quest.slug,
        name: uq.quest.name,
        description: uq.quest.description,
        icon: uq.quest.icon,
        rewardCoins: uq.quest.rewardCoins,
        rewardXP: uq.quest.rewardXP,
        condition: JSON.parse(uq.quest.condition),
        isActive: uq.quest.isActive,
        sortOrder: uq.quest.sortOrder,
      },
      date: uq.date.toISOString(),
      progress: uq.progress,
      target: uq.target,
      completed: uq.completed,
      completedAt: uq.completedAt?.toISOString(),
      claimed: uq.claimed,
    }));

    res.json({ quests });
  } catch (err) {
    console.error('Get quests error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка' } });
  }
});

// POST /api/quests/track — отметить прогресс по действию
router.post('/track', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { action, count = 1 } = req.body;
    if (!action || typeof action !== 'string') {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'action обязателен' } });
      return;
    }

    const completed = await trackQuestProgress(req.userId!, action, count);
    res.json({ completed });
  } catch (err) {
    console.error('Track quest error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка' } });
  }
});

// POST /api/quests/:id/claim — получить награду за задание
router.post('/:id/claim', verifyToken, async (req: AuthRequest, res) => {
  try {
    const result = await claimQuestReward(req.userId!, req.params.id);
    res.json({ success: true, ...result });
  } catch (err: any) {
    if (err.message === 'QUEST_NOT_FOUND') {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Задание не найдено' } });
      return;
    }
    if (err.message === 'QUEST_NOT_COMPLETED') {
      res.status(400).json({ error: { code: 'QUEST_NOT_COMPLETED', message: 'Задание не выполнено' } });
      return;
    }
    if (err.message === 'ALREADY_CLAIMED') {
      res.status(400).json({ error: { code: 'ALREADY_CLAIMED', message: 'Награда уже получена' } });
      return;
    }
    console.error('Claim quest error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка' } });
  }
});

export default router;
