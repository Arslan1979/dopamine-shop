import { prisma } from '@dopamine-shop/database';
import { addCoins } from './balanceService.js';
import { addExperience } from './levelService.js';

export async function getOrCreateDailyQuests(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all active quest templates
  const templates = await prisma.dailyQuest.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  // Get or create user quests for today
  const userQuests = await Promise.all(
    templates.map(async (template) => {
      let userQuest = await prisma.userQuest.findUnique({
        where: {
          userId_questId_date: {
            userId,
            questId: template.id,
            date: today,
          },
        },
        include: { quest: true },
      });

      if (!userQuest) {
        const condition = JSON.parse(template.condition);
        userQuest = await prisma.userQuest.create({
          data: {
            userId,
            questId: template.id,
            date: today,
            target: condition.count || 1,
          },
          include: { quest: true },
        });
      }

      return userQuest;
    })
  );

  return userQuests;
}

export async function trackQuestProgress(
  userId: string,
  action: string,
  increment: number = 1
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find active quests for today that match this action
  const activeQuests = await prisma.userQuest.findMany({
    where: {
      userId,
      date: today,
      completed: false,
      quest: {
        isActive: true,
        condition: { contains: action },
      },
    },
    include: { quest: true },
  });

  const completedQuests: Array<{
    id: string;
    name: string;
    rewardCoins: number;
    rewardXP: number;
  }> = [];

  for (const userQuest of activeQuests) {
    const condition = JSON.parse(userQuest.quest.condition);
    if (condition.action !== action) continue;

    const newProgress = Math.min(userQuest.progress + increment, userQuest.target);
    const isCompleted = newProgress >= userQuest.target;

    await prisma.userQuest.update({
      where: { id: userQuest.id },
      data: {
        progress: newProgress,
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    if (isCompleted) {
      completedQuests.push({
        id: userQuest.quest.id,
        name: userQuest.quest.name,
        rewardCoins: userQuest.quest.rewardCoins,
        rewardXP: userQuest.quest.rewardXP,
      });
    }
  }

  return completedQuests;
}

export async function claimQuestReward(userId: string, questId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const userQuest = await prisma.userQuest.findUnique({
    where: {
      userId_questId_date: {
        userId,
        questId,
        date: today,
      },
    },
    include: { quest: true },
  });

  if (!userQuest) {
    throw new Error('QUEST_NOT_FOUND');
  }

  if (!userQuest.completed) {
    throw new Error('QUEST_NOT_COMPLETED');
  }

  if (userQuest.claimed) {
    throw new Error('ALREADY_CLAIMED');
  }

  // Mark as claimed
  await prisma.userQuest.update({
    where: { id: userQuest.id },
    data: { claimed: true },
  });

  // Give rewards
  await addCoins(
    userId,
    userQuest.quest.rewardCoins,
    'QUEST_REWARD',
    `Награда за задание: ${userQuest.quest.name}`
  );

  await addExperience(userId, userQuest.quest.rewardXP);

  return {
    coinsEarned: userQuest.quest.rewardCoins,
    xpEarned: userQuest.quest.rewardXP,
  };
}

// Seed default daily quests if none exist
export async function seedDefaultQuests() {
  const count = await prisma.dailyQuest.count();
  if (count > 0) return;

  const quests = [
    {
      slug: 'visit_catalog',
      name: 'Посетить каталог',
      description: 'Зайдите на страницу каталога товаров',
      icon: 'Search',
      rewardCoins: 10,
      rewardXP: 10,
      condition: JSON.stringify({ type: 'event', action: 'visit_catalog', count: 1 }),
      sortOrder: 1,
    },
    {
      slug: 'view_product',
      name: 'Изучить товар',
      description: 'Откройте страницу любого товара',
      icon: 'Eye',
      rewardCoins: 5,
      rewardXP: 5,
      condition: JSON.stringify({ type: 'event', action: 'view_product', count: 1 }),
      sortOrder: 2,
    },
    {
      slug: 'add_to_cart',
      name: 'Добавить в корзину',
      description: 'Добавьте товар в корзину',
      icon: 'ShoppingCart',
      rewardCoins: 15,
      rewardXP: 15,
      condition: JSON.stringify({ type: 'event', action: 'add_to_cart', count: 1 }),
      sortOrder: 3,
    },
    {
      slug: 'add_to_wishlist',
      name: 'Сохранить в избранное',
      description: 'Добавьте товар в список желаний',
      icon: 'Heart',
      rewardCoins: 10,
      rewardXP: 10,
      condition: JSON.stringify({ type: 'event', action: 'add_to_wishlist', count: 1 }),
      sortOrder: 4,
    },
    {
      slug: 'place_order',
      name: 'Оформить заказ',
      description: 'Завершите оформление покупки',
      icon: 'Package',
      rewardCoins: 50,
      rewardXP: 50,
      condition: JSON.stringify({ type: 'event', action: 'place_order', count: 1 }),
      sortOrder: 5,
    },
    {
      slug: 'visit_achievements',
      name: 'Проверить достижения',
      description: 'Посетите страницу достижений',
      icon: 'Trophy',
      rewardCoins: 5,
      rewardXP: 5,
      condition: JSON.stringify({ type: 'event', action: 'visit_achievements', count: 1 }),
      sortOrder: 6,
    },
  ];

  for (const quest of quests) {
    await prisma.dailyQuest.create({ data: quest });
  }
}
