import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import {
  getOrCreateBalance,
  getTransactions,
  claimDailyLogin,
  getDailyLoginStatus,
} from '../services/balanceService.js';

const router = Router();

// GET /api/balance — текущий баланс и транзакции
router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const [balance, transactions, dailyLogin] = await Promise.all([
      getOrCreateBalance(req.userId!),
      getTransactions(req.userId!, 20),
      getDailyLoginStatus(req.userId!),
    ]);

    res.json({
      balance: { balance: balance.balance, lifetimeEarned: balance.lifetimeEarned },
      transactions,
      dailyLogin,
    });
  } catch (err) {
    console.error('Get balance error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка' } });
  }
});

// POST /api/balance/claim-daily — забрать ежедневный бонус
router.post('/claim-daily', verifyToken, async (req: AuthRequest, res) => {
  try {
    const result = await claimDailyLogin(req.userId!);
    res.json({ success: true, ...result });
  } catch (err: any) {
    if (err.message === 'ALREADY_CLAIMED') {
      res.status(400).json({ error: { code: 'ALREADY_CLAIMED', message: 'Бонус уже получен сегодня' } });
      return;
    }
    console.error('Claim daily error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка' } });
  }
});

export default router;
