import { prisma } from '@dopamine-shop/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES = '7d';

export const registerSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(8, 'Минимум 8 символов').regex(/[A-Z]/, 'Нужна заглавная буква').regex(/[0-9]/, 'Нужна цифра'),
  name: z.string().min(2, 'Минимум 2 символа').max(50, 'Максимум 50 символов'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export function generateTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
  const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
  return { accessToken, refreshToken };
}

export async function registerUser(data: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new Error('EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  // Create user with balance and level in transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: data.email,
        password: passwordHash,
        name: data.name,
      },
      select: { id: true, email: true, name: true, soundEnabled: true },
    });

    // Initialize gamification data
    await tx.userBalance.create({
      data: { userId: newUser.id, balance: 0, lifetimeEarned: 0 },
    });

    await tx.userLevel.create({
      data: { userId: newUser.id, level: 1, experience: 0, levelTitle: 'Bronze' },
    });

    return newUser;
  });

  const tokens = generateTokens(user.id);
  return { user, ...tokens };
}

export async function loginUser(data: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(data.password, user.password);
  if (!valid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const tokens = generateTokens(user.id);
  return {
    user: { id: user.id, email: user.email, name: user.name, soundEnabled: user.soundEnabled },
    ...tokens,
  };
}

export function verifyAccessToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
  } catch {
    return null;
  }
}
