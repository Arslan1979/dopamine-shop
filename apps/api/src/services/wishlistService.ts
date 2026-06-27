import { prisma } from '@dopamine-shop/database';

export async function getUserWishlist(userId: string) {
  return await prisma.wishlistItem.findMany({
    where: { userId },
    include: {
      product: {
        include: { category: { select: { id: true, name: true, slug: true } } },
      },
    },
    orderBy: { addedAt: 'desc' },
  });
}

export async function toggleWishlistItem(userId: string, productId: string) {
  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({
      where: { userId_productId: { userId, productId } },
    });
    return { removed: true };
  }

  const item = await prisma.wishlistItem.create({
    data: { userId, productId },
    include: {
      product: {
        include: { category: { select: { id: true, name: true, slug: true } } },
      },
    },
  });

  return { item };
}

export async function removeWishlistItem(userId: string, itemId: string) {
  const item = await prisma.wishlistItem.findFirst({
    where: { id: itemId, userId },
  });

  if (!item) {
    throw new Error('NOT_FOUND');
  }

  await prisma.wishlistItem.delete({ where: { id: itemId } });
}
