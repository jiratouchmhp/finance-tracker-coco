import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database';
import { APP_CONFIG } from './config/app';
import { errorHandler } from './middleware/errorHandler';

// Import models to set up associations
import './models';

// Import routes
import authRoutes from './modules/auth/routes';
import userRoutes from './modules/users/routes';
import productRoutes from './modules/products/routes';
import salesRoutes from './modules/sales/routes';
import stockRoutes from './modules/stock/routes';
import expenseRoutes from './modules/expenses/routes';
import dashboardRoutes from './modules/dashboard/routes';
import fraudRoutes from './modules/fraud/routes';

const app = express();

// Middleware
app.use(cors({ origin: APP_CONFIG.CORS_ORIGIN }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/fraud', fraudRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
async function start(): Promise<void> {
  await connectDatabase();
  app.listen(APP_CONFIG.PORT, () => {
    console.log(`[Server] Coco Tracker API running on http://localhost:${APP_CONFIG.PORT}`);
  });
}

start();
