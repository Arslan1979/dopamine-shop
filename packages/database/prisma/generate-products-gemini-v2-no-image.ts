import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

// ==================== КОНФИГУРАЦИЯ GOOGLE GEMINI ====================
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

const GEMINI_TEXT_MODEL = 'gemini-2.5-flash';

const PRODUCTS_COUNT = 20;
const USE_DEMO_FALLBACK = true;
const SAVE_IMAGES_LOCALLY = true;

interface GeneratedProduct {
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string;
  specs: Record<string, string>;
}

// ==================== УЛУЧШЕННЫЙ ПАРСИНГ JSON ====================
function extractJson(text: string): any | null {
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
  cleaned = cleaned.trim();

  const startIdx = cleaned.indexOf('{');
  if (startIdx === -1) return null;

  let depth = 0;
  let endIdx = -1;
  let inString = false;
  let escapeNext = false;

  for (let i = startIdx; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escapeNext) { escapeNext = false; continue; }
    if (ch === '\\') { escapeNext = true; continue; }
    if (ch === '"' && !escapeNext) { inString = !inString; continue; }
    if (!inString) {
      if (ch === '{') depth++;
      if (ch === '}') depth--;
      if (depth === 0) { endIdx = i; break; }
    }
  }

  let jsonStr: string;

  if (endIdx === -1) {
    jsonStr = cleaned.slice(startIdx);
    const openCount = (jsonStr.match(/\{/g) || []).length;
    const closeCount = (jsonStr.match(/\}/g) || []).length;
    const missing = openCount - closeCount;
    if (missing > 0) jsonStr = jsonStr + '}'.repeat(missing);
  } else {
    jsonStr = cleaned.slice(startIdx, endIdx + 1);
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    const fixed = jsonStr
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/\n/g, ' ');
    try {
      return JSON.parse(fixed);
    } catch {
      return null;
    }
  }
}

// ==================== GEMINI TEXT: Генерация данных товара ====================
async function generateProductData(category: string): Promise<GeneratedProduct | null> {
  // Компактный промпт без лишних слов — экономим токены
  const prompt = `Return ONLY compact JSON for a ${category} product. NO markdown, NO explanations, NO line breaks inside strings. All values must be on single lines.

{"name":"RUSSIAN_NAME","slug":"latin-slug","description":"RUSSIAN_DESC_2_SENTENCES","price":12345,"specs":{"key1":"val1","key2":"val2","key3":"val3"}}

Rules:
- name: 20-40 chars Russian
- slug: lowercase latin with hyphens
- description: 2 sentences max, NO newlines
- price: integer rubles 1000-100000
- specs: 3 simple key-value pairs`;

  try {
    const res = await fetch(
      `${GEMINI_BASE_URL}/models/${GEMINI_TEXT_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            topP: 0.95,
            maxOutputTokens: 1200, // Увеличили с 800 до 1200
          },
        }),
      }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.log(`   ⚠️ Gemini API ошибка ${res.status}: ${errData.error?.message || res.statusText}`);
      return null;
    }

    const data = await res.json() as any;
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.log('   ⚠️ Пустой ответ');
      return null;
    }

    const productData = extractJson(generatedText);

    if (!productData) {
      console.log('   ⚠️ Не удалось распарсить JSON');
      console.log('   Сырой ответ:', generatedText.slice(0, 500));
      return null;
    }

    if (!productData.name || !productData.slug || !productData.description || typeof productData.price !== 'number') {
      console.log('   ⚠️ Неполные данные');
      return null;
    }

    return {
      name: String(productData.name),
      slug: String(productData.slug),
      description: String(productData.description),
      price: Number(productData.price),
      specs: productData.specs || {},
      imageUrl: '',
    };
  } catch (err: any) {
    console.log(`   ⚠️ Ошибка: ${err.message}`);
    return null;
  }
}

// ==================== UNSPLASH: Изображения ====================
function getUnsplashImage(query: string): string {
  const encoded = encodeURIComponent(query);
  return `https://source.unsplash.com/800x800/?${encoded}`;
}

// ==================== ДЕМО-ТОВАРЫ ====================
const DEMO_PRODUCTS = [
  { name: 'Механическая клавиатура Keychron K3', slug: 'keychron-k3', category: 'electronics', price: 12990, desc: 'Компактная механическая клавиатура с низкопрофильными свитчами', specs: { 'тип': 'механическая', 'подсветка': 'RGB', 'соединение': 'Bluetooth/USB' } },
  { name: 'Умная колонка Яндекс Станция Мини', slug: 'yandex-station-mini', category: 'electronics', price: 7990, desc: 'Компактная умная колонка с голосовым помощником Алиса', specs: { 'цвет': 'чёрный', 'мощность': '10W', 'питание': 'сеть' } },
  { name: 'Беговые кроссовки Nike Air Zoom', slug: 'nike-air-zoom', category: 'sports', price: 8990, desc: 'Лёгкие кроссовки для бега с амортизацией Zoom Air', specs: { 'материал': 'сетка/резина', 'вес': '250г', 'тип': 'беговые' } },
  { name: 'Кожаный рюкзак Fossil', slug: 'fossil-leather-backpack', category: 'fashion', price: 15990, desc: 'Стильный кожаный рюкзак для ноутбука до 15"', specs: { 'материал': 'натуральная кожа', 'объём': '20л', 'цвет': 'коричневый' } },
  { name: 'Книга "Чистый код" Роберт Мартин', slug: 'clean-code-book', category: 'books', price: 2490, desc: 'Классика программирования о написании качественного кода', specs: { 'автор': 'Роберт Мартин', 'страниц': '464', 'издательство': 'Питер' } },
  { name: 'Беспроводные наушники Sony WH-1000XM5', slug: 'sony-wh1000xm5', category: 'electronics', price: 34990, desc: 'Флагманские наушники с лучшим шумоподавлением в отрасли', specs: { 'тип': 'полноразмерные', 'ANC': 'активное', 'время работы': '30ч' } },
  { name: 'Фитнес-браслет Xiaomi Mi Band 8', slug: 'xiaomi-mi-band-8', category: 'electronics', price: 3990, desc: 'Популярный фитнес-трекер с AMOLED-экраном', specs: { 'экран': 'AMOLED 1.62"', 'защита': '5ATM', 'время работы': '16 дней' } },
  { name: 'Кофемашина De\'Longhi Magnifica', slug: 'delonghi-magnifica', category: 'home', price: 45990, desc: 'Автоматическая кофемашина для приготовления эспрессо', specs: { 'давление': '15 бар', 'ёмкость': '1.8л', 'тип': 'автоматическая' } },
  { name: 'Йога-мат Liforme', slug: 'liforme-yoga-mat', category: 'sports', price: 12990, desc: 'Профессиональный йога-мат с разметкой для поз', specs: { 'материал': 'натуральный каучук', 'толщина': '4.2мм', 'вес': '2.5кг' } },
  { name: 'Пальто Zara Wool Blend', slug: 'zara-wool-coat', category: 'fashion', price: 8990, desc: 'Элегантное шерстяное пальто на осень-зиму', specs: { 'материал': 'шерсть/полиэстер', 'длина': 'средняя', 'цвет': 'песочный' } },
  { name: 'Планшет iPad Air 5', slug: 'ipad-air-5', category: 'electronics', price: 64990, desc: 'Мощный планшет с чипом M1 для творчества и работы', specs: { 'экран': '10.9" Liquid Retina', 'процессор': 'Apple M1', 'память': '64GB' } },
  { name: 'Велосипед Giant Escape 3', slug: 'giant-escape-3', category: 'sports', price: 45990, desc: 'Городской велосипед для комфортных поездок', specs: { 'рама': 'алюминий', 'скоростей': '21', 'вес': '11.8кг' } },
  { name: 'Набор посуды Tefal Ingenio', slug: 'tefal-ingenio-set', category: 'home', price: 12990, desc: 'Универсальный набор посуды со съёмными ручками', specs: { 'материал': 'алюминий', 'покрытие': 'Titanium', 'количество': '10 предметов' } },
  { name: 'Рюкзак Fjällräven Kånken', slug: 'fjallraven-kanken', category: 'fashion', price: 6990, desc: 'Легендарный шведский рюкзак для города и путешествий', specs: { 'материал': 'Vinylon F', 'объём': '16л', 'вес': '300г' } },
  { name: 'Книга "Атомные привычки" Джеймс Клир', slug: 'atomic-habits-book', category: 'books', price: 1890, desc: 'Практическое руководство по формированию полезных привычек', specs: { 'автор': 'Джеймс Клир', 'страниц': '368', 'издательство': 'МИФ' } },
  { name: 'Электросамокат Ninebot KickScooter', slug: 'ninebot-kickscooter', category: 'electronics', price: 54990, desc: 'Электрический самокат с запасом хода до 45 км', specs: { 'мощность': '350W', 'скорость': '25 км/ч', 'вес': '13кг' } },
  { name: 'Гантели разборные 20 кг', slug: 'adjustable-dumbbells-20kg', category: 'sports', price: 4990, desc: 'Набор разборных гантелей для домашних тренировок', specs: { 'материал': 'чугун/пластик', 'вес': '2x10кг', 'тип': 'разборные' } },
  { name: 'Смарт-часы Garmin Forerunner 255', slug: 'garmin-forerunner-255', category: 'electronics', price: 34990, desc: 'Продвинутые часы для бега с GPS и аналитикой', specs: { 'экран': 'MIP 1.3"', 'GPS': 'мультиполосный', 'время работы': '14 дней' } },
  { name: 'Постельное бельё из египетского хлопка', slug: 'egyptian-cotton-bedding', category: 'home', price: 8990, desc: 'Премиальное постельное бельё с плотностью 600 TC', specs: { 'материал': 'египетский хлопок', 'плотность': '600 TC', 'размер': 'евро' } },
  { name: 'Книга "Sapiens" Юваль Ной Харари', slug: 'sapiens-book', category: 'books', price: 2190, desc: 'Увлекательная история человечества от древности до наших дней', specs: { 'автор': 'Юваль Ной Харари', 'страниц': '512', 'издательство': 'Синдбад' } },
];

async function generateDemoProducts(count: number) {
  const categories = await prisma.category.findMany();
  const catMap = new Map(categories.map(c => [c.slug, c.id]));

  if (categories.length === 0) {
    throw new Error('Сначала создайте категории: pnpm run db:seed');
  }

  console.log('🎨 Демо-режим: генерация товаров с Unsplash...');

  const productsToAdd = DEMO_PRODUCTS.slice(0, count);
  let added = 0;

  for (const dp of productsToAdd) {
    const catId = catMap.get(dp.category);
    if (!catId) {
      console.log(`   ⚠️ Категория ${dp.category} не найдена`);
      continue;
    }

    const imageUrl = getUnsplashImage(dp.name);

    try {
      await prisma.product.create({
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
      console.log(`   ✅ ${dp.name}`);
      added++;
    } catch (err: any) {
      if (err.code === 'P2002') {
        console.log(`   ⏭️ ${dp.name} — уже существует`);
      } else {
        console.error(`   ❌ ${dp.name}: ${err.message}`);
      }
    }
  }

  console.log(`\n🎉 Добавлено ${added} новых товаров!`);
}

// ==================== ОСНОВНОЙ ПРОЦЕСС ====================
async function generateProducts() {
  const categories = await prisma.category.findMany();
  if (categories.length === 0) {
    throw new Error('Сначала создайте категории: pnpm run db:seed');
  }

  if (!GEMINI_API_KEY) {
    console.log('ℹ️ GEMINI_API_KEY не задан. Используем демо-режим...');
    await generateDemoProducts(PRODUCTS_COUNT);
    return;
  }

  console.log(`🎯 Генерация ${PRODUCTS_COUNT} товаров через Google Gemini...`);
  console.log(`   Текст: ${GEMINI_TEXT_MODEL}`);
  console.log(`   Изображения: Unsplash (реальные фото)`);
  console.log('');

  let demoMode = false;
  let added = 0;

  for (let i = 0; i < PRODUCTS_COUNT; i++) {
    const category = categories[i % categories.length];

    try {
      console.log(`📦 Товар ${i + 1}/${PRODUCTS_COUNT} [${category.name}]...`);

      const productData = await generateProductData(category.name);

      if (!productData) {
        if (!demoMode && USE_DEMO_FALLBACK) {
          demoMode = true;
          console.log('\n🔁 Переключение на демо-режим...');
          const remaining = PRODUCTS_COUNT - i;
          await generateDemoProducts(remaining);
          return;
        }
        continue;
      }

      console.log(`   📝 ${productData.name}`);

      // Всегда используем Unsplash для изображений (Gemini Image API недоступен)
      const imageUrl = getUnsplashImage(productData.name);
      console.log(`   🖼️ Unsplash: ${imageUrl.slice(0, 60)}...`);

      productData.imageUrl = imageUrl;

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
      added++;

      if (i < PRODUCTS_COUNT - 1) {
        await new Promise(r => setTimeout(r, 3000));
      }

    } catch (err: any) {
      console.error(`   ❌ Ошибка: ${err.message}`);
      if (!demoMode && USE_DEMO_FALLBACK) {
        demoMode = true;
        console.log('\n🔁 Переключение на демо-режим...');
        const remaining = PRODUCTS_COUNT - i - 1;
        if (remaining > 0) await generateDemoProducts(remaining);
        return;
      }
    }
  }

  console.log(`\n🎉 Готово! Добавлено ${added} товаров.`);
}

// Запуск
generateProducts()
  .catch(err => {
    console.error('\n💥 Критическая ошибка:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
