import { prisma } from '@dopamine-shop/database';
import type { UserAchievement, Achievement } from '@dopamine-shop/shared-types';

interface AchievementRule {
  type: 'orders_count' | 'total_spent' | 'hour_range' | 'streak';
  min?: number;
  max?: number;
}

export async function checkAchievements(userId: string, eventType: string, eventData?: any) {
  const unlocked: Achievement[] = [];

  // Get all achievements and user progress
  const achievements = await prisma.achievement.findMany();
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
  });

  const unlockedSlugs = new Set(userAchievements.map((ua) => ua.achievement.slug));

  for (const achievement of achievements) {
    if (unlockedSlugs.has(achievement.slug)) continue;

    const rule: AchievementRule = JSON.parse(achievement.condition);
    let shouldUnlock = false;
    let progress = 0;

    switch (rule.type) {
      case 'orders_count': {
        const orderCount = await prisma.order.count({ where: { userId } });
        progress = orderCount;
        shouldUnlock = orderCount >= (rule.min || 1);
        break;
      }
      case 'total_spent': {
        const orders = await prisma.order.findMany({ where: { userId } });
        const total = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
        progress = total;
        shouldUnlock = total >= (rule.min || 0);
        break;
      }
      case 'hour_range': {
        if (eventType === 'order_created' && eventData?.hour !== undefined) {
          shouldUnlock = eventData.hour >= (rule.min || 0) && eventData.hour <= (rule.max || 23);
          progress = shouldUnlock ? 1 : 0;
        }
        break;
      }
      case 'streak': {
        const streak = await prisma.streak.findUnique({ where: { userId } });
        progress = streak?.current || 0;
        shouldUnlock = (streak?.current || 0) >= (rule.min || 7);
        break;
      }
    }

    if (shouldUnlock) {
      await prisma.userAchievement.create({
        data: { userId, achievementId: achievement.id, progress },
      });
      unlocked.push(achievement as Achievement);
    } else if (progress > 0) {
      // Update progress if not unlocked yet
      const existing = userAchievements.find((ua) => ua.achievementId === achievement.id);
      if (existing) {
        await prisma.userAchievement.update({
          where: { id: existing.id },
          data: { progress },
        });
      }
    }
  }

  return unlocked;
}

export async function getUserAchievements(userId: string) {
  const achievements = await prisma.achievement.findMany({
    include: {
      userAchievements: {
        where: { userId },
      },
    },
  });

  const rules = achievements.map((a) => ({
    ...a,
    condition: JSON.parse(a.condition) as AchievementRule,
  }));

  // Get current progress for locked achievements
  const orderCount = await prisma.order.count({ where: { userId } });
  const orders = await prisma.order.findMany({ where: { userId } });
  const totalSpent = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const streak = await prisma.streak.findUnique({ where: { userId } });

  return achievements.map((achievement) => {
    const userAch = achievement.userAchievements[0];
    const rule = JSON.parse(achievement.condition) as AchievementRule;

    let currentProgress = userAch?.progress || 0;
    let target = rule.min || 1;

    // Calculate real-time progress for display
    if (!userAch) {
      switch (rule.type) {
        case 'orders_count': currentProgress = orderCount; break;
        case 'total_spent': currentProgress = totalSpent; break;
        case 'streak': currentProgress = streak?.current || 0; break;
      }
    }

    return {
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      iconUrl: achievement.iconUrl,
      unlocked: !!userAch,
      unlockedAt: userAch?.unlockedAt?.toISOString(),
      progress: currentProgress,
      target,
    };
  });
}

// Streak tracking
export async function updateStreak(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = await prisma.streak.findUnique({ where: { userId } });

  if (!streak) {
    streak = await prisma.streak.create({
      data: { userId, current: 1, best: 1, lastDate: today },
    });
    return streak;
  }

  const lastDate = streak.lastDate ? new Date(streak.lastDate) : null;
  if (!lastDate) {
    await prisma.streak.update({
      where: { userId },
      data: { current: 1, best: Math.max(streak.best, 1), lastDate: today },
    });
    return streak;
  }

  lastDate.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Already ordered today, no change
    return streak;
  } else if (diffDays === 1) {
    // Consecutive day
    const newCurrent = streak.current + 1;
    await prisma.streak.update({
      where: { userId },
      data: { current: newCurrent, best: Math.max(streak.best, newCurrent), lastDate: today },
    });
  } else {
    // Streak broken
    await prisma.streak.update({
      where: { userId },
      data: { current: 1, lastDate: today },
    });
  }

  return prisma.streak.findUnique({ where: { userId } });
}
