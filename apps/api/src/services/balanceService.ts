import { prisma } from '@dopamine-shop/database';
import type { TransactionType } from '@dopamine-shop/shared-types';

export async function getOrCreateBalance(userId: string) {
  let balance = await prisma.userBalance.findUnique({ where: { userId } });
  if (!balance) {
    balance = await prisma.userBalance.create({
      data: { userId, balance: 0, lifetimeEarned: 0 },
    });
  }
  return balance;
}

export async function addCoins(
  userId: string,
  amount: number,
  type: TransactionType,
  description: string,
  relatedId?: string
) {
  const balance = await getOrCreateBalance(userId);

  const [updated] = await prisma.$transaction([
    prisma.userBalance.update({
      where: { userId },
      data: {
        balance: { increment: amount },
        lifetimeEarned: { increment: amount },
      },
    }),
    prisma.transaction.create({
      data: { userId, amount, type, description, relatedId },
    }),
  ]);

  return updated;
}

export async function spendCoins(
  userId: string,
  amount: number,
  description: string,
  relatedId?: string
) {
  const balance = await getOrCreateBalance(userId);

  if (balance.balance < amount) {
    throw new Error('INSUFFICIENT_BALANCE');
  }

  const [updated] = await prisma.$transaction([
    prisma.userBalance.update({
      where: { userId },
      data: { balance: { decrement: amount } },
    }),
    prisma.transaction.create({
      data: {
        userId,
        amount: -amount,
        type: 'PURCHASE_SPEND',
        description,
        relatedId,
      },
    }),
  ]);

  return updated;
}

export async function getTransactions(userId: string, limit: number = 20) {
  return prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

// Daily login reward calculation
export function getDailyReward(dayStreak: number): number {
  if (dayStreak >= 7) return 50;
  if (dayStreak === 6) return 40;
  if (dayStreak === 5) return 30;
  if (dayStreak === 4) return 25;
  if (dayStreak === 3) return 20;
  if (dayStreak === 2) return 15;
  return 10;
}

export async function claimDailyLogin(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if already claimed today
  const existing = await prisma.dailyLogin.findUnique({
    where: {
      userId_date: { userId, date: today },
    },
  });

  if (existing) {
    throw new Error('ALREADY_CLAIMED');
  }

  // Find yesterday's login for streak calculation
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayLogin = await prisma.dailyLogin.findUnique({
    where: {
      userId_date: { userId, date: yesterday },
    },
  });

  const dayStreak = yesterdayLogin ? yesterdayLogin.dayStreak + 1 : 1;
  const coinsEarned = getDailyReward(dayStreak);

  // Create login record
  await prisma.dailyLogin.create({
    data: { userId, date: today, dayStreak, coinsEarned },
  });

  // Add coins
  await addCoins(
    userId,
    coinsEarned,
    'DAILY_BONUS',
    `Ежедневный бонус (день ${dayStreak})`
  );

  return { dayStreak, coinsEarned };
}

export async function getDailyLoginStatus(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayLogin = await prisma.dailyLogin.findUnique({
    where: {
      userId_date: { userId, date: today },
    },
  });

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayLogin = await prisma.dailyLogin.findUnique({
    where: {
      userId_date: { userId, date: yesterday },
    },
  });

  const currentStreak = todayLogin
    ? todayLogin.dayStreak
    : yesterdayLogin
      ? yesterdayLogin.dayStreak
      : 0;

  const canClaimToday = !todayLogin;
  const nextDailyReward = getDailyReward(currentStreak + (todayLogin ? 0 : 1));

  return {
    canClaimToday,
    dayStreak: currentStreak,
    nextDailyReward,
    coinsEarned: todayLogin?.coinsEarned || 0,
  };
}
