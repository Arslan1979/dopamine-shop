import { prisma } from '@dopamine-shop/database';
import type { Order, OrderItem } from '@dopamine-shop/shared-types';
import { addCoins, spendCoins } from './balanceService.js';
import { addExperience } from './levelService.js';

interface CreateOrderInput {
  userId: string;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingPhone: string;
  deliveryMethod: string;
  items: { productId: string; quantity: number; price: number }[];
  coinsToSpend?: number;
}

export async function createOrder(data: CreateOrderInput) {
  const itemsTotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryPrice = data.deliveryMethod === 'standard' ? 0 : data.deliveryMethod === 'express' ? 499 : 999;
  const coinsToSpend = data.coinsToSpend || 0;
  const finalTotal = Math.max(0, itemsTotal + deliveryPrice - coinsToSpend);

  const order = await prisma.$transaction(async (tx) => {
    // Spend coins if requested
    if (coinsToSpend > 0) {
      const balance = await tx.userBalance.findUnique({ where: { userId: data.userId } });
      if (!balance || balance.balance < coinsToSpend) {
        throw new Error('INSUFFICIENT_BALANCE');
      }
      await tx.userBalance.update({
        where: { userId: data.userId },
        data: { balance: { decrement: coinsToSpend } },
      });
    }

    // Create order
    const newOrder = await tx.order.create({
      data: {
        userId: data.userId,
        status: 'PENDING',
        totalAmount: finalTotal,
        shippingName: data.shippingName,
        shippingAddress: data.shippingAddress,
        shippingCity: data.shippingCity,
        shippingPostalCode: data.shippingPostalCode,
        shippingPhone: data.shippingPhone,
        deliveryMethod: data.deliveryMethod,
      },
    });

    // Create order items with price snapshot
    const productIds = data.items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of data.items) {
      const product = productMap.get(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);

      await tx.orderItem.create({
        data: {
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          priceSnapshot: item.price,
          productName: product.name,
          productImage: product.imageUrl,
        },
      });
    }

    // Clear user cart
    await tx.cartItem.deleteMany({ where: { userId: data.userId } });

    // Return order with items
    return await tx.order.findUnique({
      where: { id: newOrder.id },
      include: { items: true },
    });
  });

  // Post-order gamification (outside transaction to avoid locking issues)
  // Earn coins: 10% of order value
  const earnedCoins = Math.floor(itemsTotal * 0.1);
  if (earnedCoins > 0) {
    await addCoins(data.userId, earnedCoins, 'PURCHASE_EARN', `Кешбэк за заказ #${order?.id?.slice(0, 8)}`, order?.id);
  }

  // Earn XP: 1 XP per 10 rubles spent
  const earnedXP = Math.floor(itemsTotal / 10);
  if (earnedXP > 0) {
    await addExperience(data.userId, earnedXP);
  }

  // Create coin spend transaction if applicable
  if (coinsToSpend > 0) {
    await prisma.transaction.create({
      data: {
        userId: data.userId,
        amount: -coinsToSpend,
        type: 'PURCHASE_SPEND',
        description: `Списание монет за заказ #${order?.id?.slice(0, 8)}`,
        relatedId: order?.id,
      },
    });
  }

  return order;
}

export async function getUserOrders(userId: string, page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { items: true },
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  return {
    orders: orders as Order[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getOrderById(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) return null;
  if (order.userId !== userId) return null; // 403 guard

  return order as Order;
}
