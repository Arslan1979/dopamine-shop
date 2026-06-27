import { prisma } from '@dopamine-shop/database';

const statusFlow = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'] as const;

export async function updateOrderStatuses() {
  const orders = await prisma.order.findMany({
    where: {
      status: { not: 'COMPLETED' },
    },
  });

  for (const order of orders) {
    const currentIndex = statusFlow.indexOf(order.status as typeof statusFlow[number]);
    if (currentIndex < statusFlow.length - 1) {
      const hoursSinceCreated = (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60);
      const expectedIndex = Math.min(Math.floor(hoursSinceCreated / 24), statusFlow.length - 1);

      if (expectedIndex > currentIndex) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: statusFlow[expectedIndex] },
        });
        console.log(`Order ${order.id.slice(0, 8)}: ${order.status} → ${statusFlow[expectedIndex]}`);
      }
    }
  }
}

export function startOrderStatusCron() {
  console.log('📅 Order status cron initialized');
}
