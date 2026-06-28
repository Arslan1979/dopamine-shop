import { Router } from 'express';
import {
  registerSchema,
  loginSchema,
  registerUser,
  loginUser,
  generateTokens,
  verifyRefreshToken,
} from '../services/authService.js';
import { verifyToken } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { getOrCreateBalance } from '../services/balanceService.js';
import { getUserLevelData } from '../services/levelService.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ошибка валидации',
          details: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        },
      });
      return;
    }

    const result = await registerUser(parsed.data);
    res.status(201).json(result);
  } catch (err: any) {
    if (err.message === 'EMAIL_EXISTS') {
      res.status(409).json({ error: { code: 'VALIDATION_ERROR', message: 'Email уже используется' } });
      return;
    }
    console.error('Register error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } });
  }
});

router.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ошибка валидации',
          details: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        },
      });
      return;
    }

    const result = await loginUser(parsed.data);
    res.status(200).json(result);
  } catch (err: any) {
    if (err.message === 'INVALID_CREDENTIALS') {
      res.status(401).json({ error: { code: 'AUTH_ERROR', message: 'Неверный email или пароль' } });
      return;
    }
    console.error('Login error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(401).json({ error: { code: 'AUTH_ERROR', message: 'Refresh token отсутствует' } });
      return;
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      res.status(401).json({ error: { code: 'AUTH_ERROR', message: 'Refresh token недействителен' } });
      return;
    }

    const tokens = generateTokens(payload.userId);
    res.status(200).json(tokens);
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } });
  }
});

router.get('/me', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { prisma } = await import('@dopamine-shop/database');
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, soundEnabled: true },
    });
    if (!user) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Пользователь не найден' } });
      return;
    }

    // Get gamification data
    const balance = await getOrCreateBalance(req.userId!);
    const level = await getUserLevelData(req.userId!);

    res.json({
      user: {
        ...user,
        balance: { balance: balance.balance, lifetimeEarned: balance.lifetimeEarned },
        level,
      },
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } });
  }
});

export default router;
