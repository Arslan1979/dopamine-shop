import { prisma } from '@dopamine-shop/database';
import type { Order, OrderItem } from '@dopamine-shop/shared-types';

interface CreateOrderInput {
  userId: string;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingPhone: string;
  deliveryMethod: string;
  items: { productId: string; quantity: number; price: number }[];
}

export async function createOrder(data: CreateOrderInput) {
  const totalAmount = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryPrice = data.deliveryMethod === 'standard' ? 0 : data.deliveryMethod === 'express' ? 499 : 999;

  return await prisma.$transaction(async (tx) => {
    // Create order
    const order = await tx.order.create({
      data: {
        userId: data.userId,
        status: 'PENDING',
        totalAmount: totalAmount + deliveryPrice,
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
          orderId: order.id,
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
      where: { id: order.id },
      include: { items: true },
    });
  });
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
