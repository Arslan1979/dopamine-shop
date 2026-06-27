# DopamineShop — GRACE Execute (Все фазы)

Полный проект, сгенерированный с помощью `grace-execute` на основе `grace-plan` контрактов.

## Выполненные модули (14/14)

### Phase 1: Фундамент (M1–M3)
| Модуль | Статус | Контракты | Реализация |
|--------|--------|-----------|------------|
| **M1** `project-setup` | ✅ | C1.1–C1.4 | Turborepo, Docker Compose, CI, .env |
| **M2** `database-schema` | ✅ | C2.1–C2.4 | Prisma schema, 8 моделей, seed |
| **M3** `auth-system` | ✅ | C3.1–C3.7 | JWT auth, bcrypt, Zod, Zustand |

### Phase 2: Каталог и Корзина (M4–M6)
| Модуль | Статус | Контракты | Реализация |
|--------|--------|-----------|------------|
| **M4** `product-catalog` | ✅ | C4.1–C4.7 | API фильтры/пагинация, ProductGrid, FilterBar |
| **M5** `product-detail` | ✅ | C5.1–C5.5 | Gallery, QuantitySelector, related products |
| **M6** `shopping-cart` | ✅ | C6.1–C6.8 | localStorage + API sync, CartDrawer |

### Phase 3: Оформление и "оплата" (M7–M9)
| Модуль | Статус | Контракты | Реализация |
|--------|--------|-----------|------------|
| **M7** `checkout-flow` | ✅ | C7.1–C7.7 | Wizard (3 steps), Zod validation, progress bar |
| **M8** `fake-payment` | ✅ | C8.1–C8.7 | Payment animation, confetti, QR receipt, atomic order |
| **M9** `order-history` | ✅ | C9.1–C9.6 | Order list, detail, timeline, status cron |

### Phase 4: Дофамин-фичи (M10–M12)
| Модуль | Статус | Контракты | Реализация |
|--------|--------|-----------|------------|
| **M10** `gamification` | ✅ | C10.1–C10.7 | AchievementEngine (rules), StreakTracker, toast + confetti |
| **M11** `wishlist` | ✅ | C11.1–C11.5 | Toggle heart, move-to-cart, fake sale notification |
| **M12** `sound-effects` | ✅ | C12.1–C12.4 | Web Audio API, LRU cache, lazy init, volume control |

## Полный флоу приложения

```
Главная (/) → Каталог (/catalog) → Карточка товара (/product/:slug)
  → "В корзину" (sound: pop) → Корзина (drawer) → "Оформить"
  → Checkout (/checkout) [auth required]
    → Step 1: Адрес (Zod validation)
    → Step 2: Доставка (radio-group)
    → Step 3: Review → "Оплатить"
  → Payment (/payment)
    → Animation: "Подключение..." → "Проверка..." → "Успешно!"
    → Confetti burst + sound: cha-ching
    → Atomic order creation → Clear cart
    → Receipt with QR code
  → Order History (/orders) → Timeline + auto status updates
  → Achievements (/achievements) → Streak + badges + progress
  → Wishlist (/wishlist) → Toggle heart + fake sale notification
```

## API Endpoints (все реализовано)

| Endpoint | Method | Auth | Описание |
|----------|--------|------|----------|
| `/api/auth/register` | POST | — | Регистрация |
| `/api/auth/login` | POST | — | Вход |
| `/api/auth/refresh` | POST | — | Обновление токенов |
| `/api/auth/me` | GET | ✅ | Текущий пользователь |
| `/api/products` | GET | — | Каталог с фильтрами |
| `/api/products/:slug` | GET | — | Детали товара |
| `/api/categories` | GET | — | Категории |
| `/api/cart` | GET | ✅ | Корзина |
| `/api/cart/sync` | POST | ✅ | Синхронизация |
| `/api/orders` | POST | ✅ | Создание заказа |
| `/api/orders` | GET | ✅ | История |
| `/api/orders/:id` | GET | ✅ | Детали |
| `/api/achievements` | GET | ✅ | Достижения |
| `/api/achievements/check` | POST | ✅ | Проверка новых |
| `/api/wishlist` | GET | ✅ | Список желаний |
| `/api/wishlist` | POST | ✅ | Toggle |
| `/api/wishlist/:id` | DELETE | ✅ | Удалить |

## Архитектурные решения Phase 4

- **AchievementEngine:** Rule-based system (JSON conditions). Types: orders_count, total_spent, hour_range, streak. Real-time progress calculation for locked achievements.
- **StreakTracker:** Timezone-aware (UTC). Diff days = 1 → increment, > 1 → reset. Best streak persisted.
- **AchievementToast:** Slide-in from bottom-right, auto-close 5s, confetti burst from toast position.
- **WishlistHeart:** Optimistic toggle with scale animation. Independent component reusable in ProductCard and ProductDetail.
- **Fake Sale:** Toast notification on wishlist page after 3 days (simulated for demo).
- **AudioManager:** Web Audio API singleton. Lazy context init (user gesture required). LRU cache (max 5 buffers). Volume control 0-100%. Settings persisted in localStorage.
- **Sound Events:** add-to-cart → pop, purchase-success → cha-ching, achievement-unlock → fanfare, error → buzzer.

## Запуск

```bash
# 1. Установить зависимости
pnpm install

# 2. Инфраструктура
docker-compose up -d postgres redis

# 3. База данных
pnpm run db:generate
pnpm run db:migrate
pnpm run db:seed

# 4. Dev серверы
pnpm run dev
# API → http://localhost:3001
# Web → http://localhost:3000
```

## Структура проекта

```
dopamine-shop/
├── apps/
│   ├── api/                    # Express + TypeScript
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── products.ts
│   │   │   │   ├── cart.ts
│   │   │   │   ├── orders.ts
│   │   │   │   ├── achievements.ts
│   │   │   │   └── wishlist.ts
│   │   │   ├── services/
│   │   │   │   ├── authService.ts
│   │   │   │   ├── productService.ts
│   │   │   │   ├── orderService.ts
│   │   │   │   └── achievementService.ts
│   │   │   ├── middleware/auth.ts
│   │   │   └── cron/orderStatusCron.ts
│   │   └── Dockerfile
│   └── web/                    # React 19 + Vite + Tailwind + Zustand
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── components/
│       │   │   ├── Layout.tsx
│       │   │   ├── ProductCard.tsx
│       │   │   ├── ProductGrid.tsx
│       │   │   ├── FilterBar.tsx
│       │   │   ├── CartDrawer.tsx
│       │   │   ├── PaymentProcessing.tsx
│       │   │   ├── OrderReceipt.tsx
│       │   │   ├── StatusBadge.tsx
│       │   │   ├── OrderTimeline.tsx
│       │   │   ├── AchievementCard.tsx
│       │   │   ├── StreakWidget.tsx
│       │   │   ├── AchievementToast.tsx
│       │   │   ├── WishlistHeart.tsx
│       │   │   ├── SoundSettings.tsx
│       │   │   └── checkout/
│       │   │       ├── ShippingForm.tsx
│       │   │       ├── DeliveryForm.tsx
│       │   │       └── ReviewOrder.tsx
│       │   ├── pages/
│       │   │   ├── HomePage.tsx
│       │   │   ├── LoginPage.tsx
│       │   │   ├── RegisterPage.tsx
│       │   │   ├── CatalogPage.tsx
│       │   │   ├── ProductDetailPage.tsx
│       │   │   ├── CheckoutPage.tsx
│       │   │   ├── PaymentPage.tsx
│       │   │   ├── OrderListPage.tsx
│       │   │   ├── OrderDetailPage.tsx
│       │   │   ├── AchievementsPage.tsx
│       │   │   └── WishlistPage.tsx
│       │   ├── hooks/useAuth.ts
│       │   ├── stores/
│       │   │   ├── authStore.ts
│       │   │   ├── productStore.ts
│       │   │   ├── cartStore.ts
│       │   │   └── checkoutStore.ts
│       │   ├── lib/
│       │   │   ├── audio/AudioManager.ts
│       │   │   └── validation/checkoutSchema.ts
│       │   └── index.css
│       └── Dockerfile
├── packages/
│   ├── shared-types/
│   └── database/
├── docker-compose.yml
├── turbo.json
└── .github/workflows/ci.yml
```
