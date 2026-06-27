import { prisma } from '@dopamine-shop/database';
import type { Product, Category } from '@dopamine-shop/shared-types';

interface ProductFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest';
  page?: number;
  limit?: number;
}

export async function getProducts(filters: ProductFilters) {
  const { categoryId, minPrice, maxPrice, search, sort = 'newest', page = 1, limit = 20 } = filters;

  const where: any = {};
  if (categoryId) where.categoryId = categoryId;
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const orderBy: any = {};
  if (sort === 'price_asc') orderBy.price = 'asc';
  else if (sort === 'price_desc') orderBy.price = 'desc';
  else orderBy.createdAt = 'desc';

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: { category: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products as Product[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });

  if (!product) return null;

  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    take: 4,
    include: { category: { select: { id: true, name: true, slug: true } } },
  });

  return { product: product as Product, relatedProducts: relatedProducts as Product[] };
}

export async function getCategories() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    productCount: c._count.products,
  })) as Category[];
}
