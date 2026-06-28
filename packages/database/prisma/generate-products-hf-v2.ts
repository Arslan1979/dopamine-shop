import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

// ==================== КОНФИГУРАЦИЯ HUGGING FACE INFERENCE PROVIDERS ====================
// Новый unified API (2026): https://router.huggingface.co — стабильнее, OpenAI-compatible
const HF_API_KEY = process.env.HF_API_KEY || '';
const HF_BASE_URL = 'https://router.huggingface.co';

// Модели через Inference Providers (бесплатный tier с лимитами)
const HF_TEXT_MODEL = 'mistralai/Mistral-7B-Instruct-v0.3';  // Через hf-inference или провайдер
const HF_IMAGE_MODEL = 'black-forest-labs/FLUX.1-schnell';     // Через hf-inference

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

// ==================== HUGGING FACE TEXT: Генерация через Inference Providers ====================
async function generateProductData(category: string): Promise<GeneratedProduct | null> {
  const systemPrompt = 'You are an e-commerce product data generator. Respond ONLY with valid JSON, no markdown, no explanations.';

  const userPrompt = `Generate product data for category "${category}" in Russian.

Requirements:
- name: realistic product name in Russian (20-50 chars)
- slug: latin slug with hyphens (e.g., "mehanicheskaya-klaviatura")
- description: detailed description in Russian, 2-3 sentences highlighting benefits
- price: realistic price in rubles, integer (e.g., 12990)
- specs: 3-4 characteristics as object {key: value}

Response format (strict JSON):
{
  "name": "...",
  "slug": "...",
  "description": "...",
  "price": 12345,
  "specs": { "цвет": "...", "материал": "...", "вес": "..." }
}`;

  try {
    // Используем OpenAI-compatible endpoint Inference Providers
    const res = await fetch(`${HF_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HF_API_KEY}`,
      },
      body: JSON.stringify({
        model: HF_TEXT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 800,
        temperature: 0.7,
        top_p: 0.9,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.log(`   ⚠️ HF API ошибка ${res.status}: ${errText.slice(0, 200)}`);
      return null;
    }

    const data = await res.json() as any;
    const generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      console.log('   ⚠️ Пустой ответ от HF');
      return null;
    }

    // Извлекаем JSON
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('   ⚠️ JSON не найден в ответе');
      console.log('   Ответ:', generatedText.slice(0, 200));
      return null;
    }

    const productData = JSON.parse(jsonMatch[0]);

    return {
      name: productData.name,
      slug: productData.slug,
      description: productData.description,
      price: productData.price,
      specs: productData.specs || {},
      imageUrl: '',
    };
  } catch (err: any) {
    console.log(`   ⚠️ Ошибка HF Text: ${err.message}`);
    return null;
  }
}

// ==================== HUGGING FACE IMAGE: Генерация через Inference Providers ====================
async function generateImage(productName: string, category: string, slug: string): Promise<string | null> {
  const prompt = `Professional e-commerce product photo of ${productName}, ${category}, white clean background, studio lighting, high quality, sharp details, minimal composition, product centered, commercial photography style, no text, no watermark`;

  try {
    // Используем hf-inference endpoint для изображений
    const res = await fetch(`${HF_BASE_URL}/hf-inference/models/${HF_IMAGE_MODEL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HF_API_KEY}`,
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          num_inference_steps: 4,
          guidance_scale: 7.5,
          width: 1024,
          height: 1024,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.log(`   ⚠️ HF Image API ошибка ${res.status}: ${errText.slice(0, 200)}`);
      return null;
    }

    // HF возвращает Blob с изображением
    const imageBlob = await res.blob();
    const buffer = Buffer.from(await imageBlob.arrayBuffer());

    if (SAVE_IMAGES_LOCALLY) {
      const publicDir = join(process.cwd(), '..', '..', 'web', 'public', 'products');
      if (!existsSync(publicDir)) {
        mkdirSync(publicDir, { recursive: true });
      }

      const filename = `${slug}-${Date.now()}.png`;
      const filepath = join(publicDir, filename);
      writeFileSync(filepath, buffer);

      return `/products/${filename}`;
    }

    return `data:image/png;base64,${buffer.toString('base64')}`;

  } catch (err: any) {
    console.log(`   ⚠️ Ошибка HF Image: ${err.message}`);
    return null;
  }
}

// ==================== UNSPLASH: Fallback ====================
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

  if (!HF_API_KEY) {
    console.log('ℹ️ HF_API_KEY не задан. Используем демо-режим...');
    await generateDemoProducts(PRODUCTS_COUNT);
    return;
  }

  console.log(`🎯 Генерация ${PRODUCTS_COUNT} товаров через Hugging Face Inference Providers...`);
  console.log(`   Base URL: ${HF_BASE_URL}`);
  console.log(`   Текстовая модель: ${HF_TEXT_MODEL}`);
  console.log(`   Модель изображений: ${HF_IMAGE_MODEL}`);
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

      let imageUrl = await generateImage(productData.name, category.name, productData.slug);

      if (!imageUrl) {
        console.log('   🖼️ HF Image недоступен, используем Unsplash');
        imageUrl = getUnsplashImage(productData.name);
      } else {
        console.log(`   🎨 Изображение сгенерировано`);
      }

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
        await new Promise(r => setTimeout(r, 2000));
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
