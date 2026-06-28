export interface User {
  id: string;
  email: string;
  name: string;
  soundEnabled: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string;
  category: Category;
  inStock: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface Order {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingPhone: string;
  deliveryMethod: string;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  priceSnapshot: number;
  productName: string;
  productImage: string;
}

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  target: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  code: 'VALIDATION_ERROR' | 'AUTH_ERROR' | 'NOT_FOUND' | 'FORBIDDEN' | 'INTERNAL_ERROR';
  message: string;
  details?: Array<{ field: string; message: string }>;
}

// ===== Gamification Types =====

export interface UserBalance {
  balance: number;
  lifetimeEarned: number;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string;
  relatedId?: string;
  createdAt: string;
}

export type TransactionType =
  | 'DAILY_BONUS'
  | 'QUEST_REWARD'
  | 'PURCHASE_EARN'
  | 'PURCHASE_SPEND'
  | 'LEVEL_UP'
  | 'ADMIN_ADJUST';

export interface UserLevel {
  level: number;
  experience: number;
  levelTitle: string;
  nextLevelXP: number;
  currentLevelXP: number;
  progress: number; // 0-100
}

export type LevelTitle = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export const LEVEL_TITLES: Record<number, LevelTitle> = {
  1: 'Bronze',
  2: 'Silver',
  3: 'Gold',
  4: 'Platinum',
};

export const LEVEL_THRESHOLDS = [
  { level: 1, minXP: 0, title: 'Bronze' as LevelTitle },
  { level: 2, minXP: 500, title: 'Silver' as LevelTitle },
  { level: 3, minXP: 1500, title: 'Gold' as LevelTitle },
  { level: 4, minXP: 3500, title: 'Platinum' as LevelTitle },
];

export function getLevelForXP(xp: number): { level: number; title: LevelTitle; nextLevelXP: number; currentLevelXP: number } {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].minXP) {
      const next = LEVEL_THRESHOLDS[i + 1];
      return {
        level: LEVEL_THRESHOLDS[i].level,
        title: LEVEL_THRESHOLDS[i].title,
        nextLevelXP: next ? next.minXP : LEVEL_THRESHOLDS[i].minXP + 2000,
        currentLevelXP: LEVEL_THRESHOLDS[i].minXP,
      };
    }
  }
  return { level: 1, title: 'Bronze', nextLevelXP: 500, currentLevelXP: 0 };
}

export interface DailyQuest {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  rewardCoins: number;
  rewardXP: number;
  condition: QuestCondition;
  isActive: boolean;
  sortOrder: number;
}

export interface QuestCondition {
  type: string;
  action: string;
  count: number;
}

export interface UserQuest {
  id: string;
  questId: string;
  quest: DailyQuest;
  date: string;
  progress: number;
  target: number;
  completed: boolean;
  completedAt?: string;
  claimed: boolean;
}

export interface DailyLoginInfo {
  date: string;
  dayStreak: number;
  coinsEarned: number;
  canClaimToday: boolean;
  nextDailyReward: number;
}

export interface GamificationProfile {
  balance: UserBalance;
  level: UserLevel;
  dailyQuests: UserQuest[];
  dailyLogin: DailyLoginInfo;
  recentTransactions: Transaction[];
}
