import express from 'express';
import cors from 'cors';
import { httpLogger } from './lib/logger';
import { errorMiddleware } from './middlewares/error.middleware';
import apiRoutes from './modules';
import { env } from './config/env';

const app = express();
const allowedOrigins = env.CORS_ORIGIN;

app.use(
  cors({
    origin: allowedOrigins?.length ? allowedOrigins : '*',
  })
);
app.use(express.json());
app.use(httpLogger);

app.use('/api/v1', apiRoutes);

app.get('/api/v1/health', async (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
    version: '1.0.0'
  });
});

app.use(errorMiddleware);

export default app;
