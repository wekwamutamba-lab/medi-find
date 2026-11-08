import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import medicinesRoutes from './routes/medicines.routes';
import batchesRoutes from './routes/batches.routes';
import movementsRoutes from './routes/movements.routes';
import alertsRoutes from './routes/alerts.routes';
import aiRoutes from './routes/ai.routes';
import salesRoutes from './routes/sales.routes';
import directoryRoutes from './routes/directory.routes';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', generalLimiter);

app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', medicinesRoutes);
app.use('/api', batchesRoutes);
app.use('/api', movementsRoutes);
app.use('/api', alertsRoutes);
app.use('/api', aiRoutes);
app.use('/api', salesRoutes);
app.use('/api', directoryRoutes);

app.use((_req, res) => {
  res.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

app.use(errorHandler);

export default app;
