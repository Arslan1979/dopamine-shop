import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/authService.js';

export interface AuthRequest extends Request {
  userId?: string;
}

export function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: { code: 'AUTH_ERROR', message: 'Требуется авторизация' } });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyAccessToken(token);

  if (!payload) {
    res.status(401).json({ error: { code: 'AUTH_ERROR', message: 'Токен недействителен или истёк' } });
    return;
  }

  req.userId = payload.userId;
  next();
}
