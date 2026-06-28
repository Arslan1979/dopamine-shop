import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

// Конфигурация
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = 'gpt-4o-mini';
const DALLE_MODEL = 'dall-e-3';
const PRODUCTS_COUNT = 5; // Сколько товаров сгенерировать

interface GeneratedProduct {
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string;
  specs: Record<string, string>;
}

// Генерация данных товара через GPT
async function generateProductData(category: string): Promise<GeneratedProduct> {
  const prompt = `Сгенерируй JSON с данными товара из категории "${category}" для интернет-магазина.
Формат:
{
  "name": "Название товара (на русском)",
  "slug": "latin-slug-iz-nazvaniya",
  "description": "Подробное описание товара на русском, 2-3 предложения",
  "price": 12345,
  "specs": { "цвет": "...", "вес": "...", "материал": "..." }
}
Цена должна быть реалистичной в рублях (целое число, без копеек).`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: 'Ты генератор данных для e-commerce. Отвечай только JSON, без markdown.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${err}`);
  }

  const data = await res.json() as any;
  const content = data.choices[0].message.content;

  // Парсим JSON из ответа (убираем markdown если есть)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');

  const productData = JSON.parse(jsonMatch[0]);

  return {
    name: productData.name,
    slug: productData.slug,
    description: productData.description,
    price: productData.price,
    specs: productData.specs || {},
    imageUrl: '', // заполним позже через DALL-E
  };
}

// Генерация изображения через DALL-E
async function generateImage(productName: string, category: string): Promise<string> {
  const prompt = `Professional product photography of ${productName}, ${category} category, 
white background, studio lighting, high quality, e-commerce style, clean minimal composition`;

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: DALLE_MODEL,
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DALL-E API error: ${err}`);
  }

  const data = await res.json() as any;
  return data.data[0].url;
}

// Альтернатива: Unsplash для реальных фото (бесплатно, без API ключа)
async function getUnsplashImage(query: string): Promise<string> {
  // Используем Unsplash Source (deprecated, но работает) или API
  // Для демо: возвращаем placeholder с поисковым запросом
  const encoded = encodeURIComponent(query);
  return `https://source.unsplash.com/800x800/?${encoded}`;

  // Для production с API ключом:
  // const res = await fetch(`https://api.unsplash.com/search/photos?query=${encoded}&per_page=1`, {
  //   headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` }
  // });
  // const data = await res.json();
  // return data.results[0]?.urls?.regular || '';
}

// Основной процесс генерации
async function generateProducts() {
  if (!OPENAI_API_KEY) {
    console.log('⚠️ OPENAI_API_KEY не задан. Используем демо-режим с Unsplash...');
    await generateDemoProducts();
    return;
  }

  const categories = await prisma.category.findMany();
  if (categories.length === 0) {
    throw new Error('Сначала создайте категории: pnpm run db:seed');
  }

  console.log(`🎯 Генерация ${PRODUCTS_COUNT} товаров...`);

  for (let i = 0; i < PRODUCTS_COUNT; i++) {
    const category = categories[i % categories.length];

    try {
      console.log(`\n📦 Генерация товара ${i + 1}/${PRODUCTS_COUNT}...`);

      // 1. Генерируем данные
      const productData = await generateProductData(category.name);
      console.log(`   📝 Название: ${productData.name}`);

      // 2. Генерируем изображение
      console.log(`   🎨 Генерация изображения...`);
      productData.imageUrl = await generateImage(productData.name, category.name);
      console.log(`   ✅ Изображение: ${productData.imageUrl.slice(0, 60)}...`);

      // 3. Сохраняем в БД
      const product = await prisma.product.create({
        data: {
          name: productData.name,
          slug: productData.slug,
          description: productData.description,
          price: productData.price,
          imageUrl: productData.imageUrl,
          specs: productData.specs,
          categoryId: category.id,
        },
      });

      console.log(`   💾 Сохранено: ${product.id}`);

      // Задержка между запросами (rate limits)
      if (i < PRODUCTS_COUNT - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }

    } catch (err) {
      console.error(`   ❌ Ошибка: ${err.message}`);
    }
  }

  console.log('\n🎉 Генерация завершена!');
}

// Демо-режим без OpenAI (бесплатно, через Unsplash)
async function generateDemoProducts() {
  const demoProducts = [
    { name: 'Механическая клавиатура Keychron K3', slug: 'keychron-k3', category: 'electronics', price: 12990, desc: 'Компактная механическая клавиатура с низкопрофильными свитчами', specs: { 'тип': 'механическая', 'подсветка': 'RGB', 'соединение': 'Bluetooth/USB' } },
    { name: 'Умная колонка Яндекс Станция Мини', slug: 'yandex-station-mini', category: 'electronics', price: 7990, desc: 'Компактная умная колонка с Алисой', specs: { 'цвет': 'чёрный', 'мощность': '10W', 'питание': 'сеть' } },
    { name: 'Беговые кроссовки Nike Air Zoom', slug: 'nike-air-zoom', category: 'sports', price: 8990, desc: 'Лёгкие кроссовки для бега с амортизацией Zoom Air', specs: { 'материал': 'сетка/резина', 'вес': '250г', 'тип': 'беговые' } },
    { name: 'Кожаный рюкзак Fossil', slug: 'fossil-leather-backpack', category: 'fashion', price: 15990, desc: 'Стильный кожаный рюкзак для ноутбука', specs: { 'материал': 'натуральная кожа', 'объём': '20л', 'цвет': 'коричневый' } },
    { name: 'Книга "Чистый код" Роберт Мартин', slug: 'clean-code-book', category: 'books', price: 2490, desc: 'Классика программирования о написании качественного кода', specs: { 'автор': 'Роберт Мартин', 'страниц': '464', 'издательство': 'Питер' } },
  ];

  const categories = await prisma.category.findMany();
  const catMap = new Map(categories.map(c => [c.slug, c.id]));

  console.log('🎨 Демо-режим: генерация через Unsplash...');

  for (const dp of demoProducts) {
    const catId = catMap.get(dp.category);
    if (!catId) {
      console.log(`⚠️ Категория ${dp.category} не найдена`);
      continue;
    }

    const imageUrl = await getUnsplashImage(dp.name);

    try {
      const product = await prisma.product.create({
        data: {
          name: dp.name,
          slug: dp.slug,
          description: dp.desc,
          price: dp.price,
          imageUrl: imageUrl,
          specs: dp.specs,
          categoryId: catId,
        },
      });
      console.log(`✅ ${dp.name} — сохранено`);
    } catch (err: any) {
      if (err.code === 'P2002') {
        console.log(`⏭️ ${dp.name} — уже существует`);
      } else {
        console.error(`❌ ${dp.name}: ${err.message}`);
      }
    }
  }

  console.log('\n🎉 Демо-генерация завершена!');
}

// Запуск
generateProducts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
