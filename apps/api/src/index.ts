import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import achievementRoutes from './routes/achievements.js';
import wishlistRoutes from './routes/wishlist.js';
import balanceRoutes from './routes/balance.js';
import questRoutes from './routes/quests.js';
import levelRoutes from './routes/levels.js';
import { startOrderStatusCron } from './cron/orderStatusCron.js';
import { seedDefaultQuests } from './services/questService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.WEB_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/balance', balanceRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/level', levelRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  startOrderStatusCron();

  // Seed default daily quests
  seedDefaultQuests().catch((err) => {
    console.error('Failed to seed quests:', err);
  });
});
