import { prisma } from '@dopamine-shop/database';
import { getLevelForXP } from '@dopamine-shop/shared-types';
import { addCoins } from './balanceService.js';

export async function getOrCreateLevel(userId: string) {
  let level = await prisma.userLevel.findUnique({ where: { userId } });
  if (!level) {
    level = await prisma.userLevel.create({
      data: { userId, level: 1, experience: 0, levelTitle: 'Bronze' },
    });
  }
  return level;
}

export async function addExperience(userId: string, amount: number) {
  const level = await getOrCreateLevel(userId);
  const newXP = level.experience + amount;

  const currentLevelInfo = getLevelForXP(level.experience);
  const newLevelInfo = getLevelForXP(newXP);

  const leveledUp = newLevelInfo.level > currentLevelInfo.level;

  const updated = await prisma.userLevel.update({
    where: { userId },
    data: {
      experience: newXP,
      level: newLevelInfo.level,
      levelTitle: newLevelInfo.title,
    },
  });

  // Bonus coins for leveling up
  if (leveledUp) {
    const levelBonus = newLevelInfo.level * 100; // 100, 200, 300, 400
    await addCoins(
      userId,
      levelBonus,
      'LEVEL_UP',
      `Повышение уровня до ${newLevelInfo.title}!`
    );
  }

  return { updated, leveledUp, oldLevel: currentLevelInfo.level, newLevel: newLevelInfo.level };
}

export async function getUserLevelData(userId: string) {
  const level = await getOrCreateLevel(userId);
  const info = getLevelForXP(level.experience);

  return {
    level: level.level,
    experience: level.experience,
    levelTitle: level.levelTitle,
    nextLevelXP: info.nextLevelXP,
    currentLevelXP: info.currentLevelXP,
    progress: Math.round(
      ((level.experience - info.currentLevelXP) /
        (info.nextLevelXP - info.currentLevelXP)) *
        100
    ),
  };
}
