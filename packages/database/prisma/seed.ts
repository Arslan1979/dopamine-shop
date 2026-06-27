import { prisma } from '../src/index';

async function main() {
  // Categories
  const electronics = await prisma.category.create({
    data: { name: 'Электроника', slug: 'electronics', description: 'Гаджеты и устройства' }
  });
  const fashion = await prisma.category.create({
    data: { name: 'Мода', slug: 'fashion', description: 'Одежда и аксессуары' }
  });
  const home = await prisma.category.create({
    data: { name: 'Дом', slug: 'home', description: 'Товары для дома' }
  });
  const sports = await prisma.category.create({
    data: { name: 'Спорт', slug: 'sports', description: 'Спортивные товары' }
  });
  const books = await prisma.category.create({
    data: { name: 'Книги', slug: 'books', description: 'Книги и журналы' }
  });

  // Products
  const products = [
    { name: 'iPhone 15 Pro', slug: 'iphone-15-pro', price: 99999, categoryId: electronics.id, imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500', description: 'Флагманский смартфон с титановым корпусом', specs: { color: 'Titan', storage: '256GB' } },
    { name: 'Sony WH-1000XM5', slug: 'sony-wh1000xm5', price: 29999, categoryId: electronics.id, imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500', description: 'Беспроводные наушники с шумоподавлением', specs: { color: 'Black', battery: '30h' } },
    { name: 'MacBook Air M3', slug: 'macbook-air-m3', price: 129999, categoryId: electronics.id, imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=500', description: 'Ультратонкий ноутбук на чипе M3', specs: { color: 'Midnight', ram: '16GB' } },
    { name: 'Nike Air Max', slug: 'nike-air-max', price: 12999, categoryId: fashion.id, imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', description: 'Культовые кроссовки с видимой подушкой', specs: { color: 'Red', size: '42-46' } },
    { name: 'Leather Jacket', slug: 'leather-jacket', price: 24999, categoryId: fashion.id, imageUrl: 'https://images.unsplash.com/photo-1551028919-ac76c90f27a8?w=500', description: 'Классическая кожаная куртка', specs: { color: 'Black', material: 'Genuine leather' } },
    { name: 'Smart Lamp', slug: 'smart-lamp', price: 3499, categoryId: home.id, imageUrl: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=500', description: 'Умная лампа с управлением через приложение', specs: { color: 'White', wattage: '9W' } },
    { name: 'Yoga Mat', slug: 'yoga-mat', price: 1999, categoryId: sports.id, imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500', description: 'Нескользящий коврик для йоги', specs: { color: 'Purple', thickness: '6mm' } },
    { name: 'Dumbbells Set', slug: 'dumbbells-set', price: 4999, categoryId: sports.id, imageUrl: 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=500', description: 'Набор гантелей 2-10 кг', specs: { weight: '2-10kg', material: 'Cast iron' } },
    { name: 'Coffee Maker', slug: 'coffee-maker', price: 8999, categoryId: home.id, imageUrl: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500', description: 'Капельная кофеварка с таймером', specs: { color: 'Silver', capacity: '1.2L' } },
    { name: 'Sci-Fi Novel', slug: 'sci-fi-novel', price: 899, categoryId: books.id, imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500', description: 'Бестселлер в жанре научной фантастики', specs: { pages: '384', language: 'Russian' } },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  // Test Users
  await prisma.user.create({
    data: {
      email: 'demo@dopamine.shop',
      password: '$2b$12$demo_hash_will_be_replaced', // placeholder
      name: 'Демо Пользователь'
    }
  });

  // Achievements
  const achievements = [
    { slug: 'first-purchase', name: 'Первый заказ', description: 'Совершите первую покупку', condition: '{"type":"orders_count","min":1}' },
    { slug: 'shopaholic', name: 'Шопоголик', description: 'Совершите 10 заказов', condition: '{"type":"orders_count","min":10}' },
    { slug: 'big-spender', name: 'Большой spender', description: 'Потратьте более 100 000 ₽', condition: '{"type":"total_spent","min":100000}' },
    { slug: 'night-owl', name: 'Ночная сова', description: 'Совершите покупку с 00:00 до 06:00', condition: '{"type":"hour_range","min":0,"max":6}' },
    { slug: 'streak-7', name: 'Недельный марафон', description: '7 дней покупок подряд', condition: '{"type":"streak","min":7}' },
  ];

  for (const a of achievements) {
    await prisma.achievement.create({ data: a });
  }

  console.log('✅ Seed completed: 5 categories, 10 products, 1 user, 5 achievements');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
