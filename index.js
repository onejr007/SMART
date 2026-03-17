import functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import apiRoutes from './api/routes.js';
import { sanitizationMiddleware } from './utils/sanitizer.js';
import { globalErrorHandler, NotFoundError } from './api/errorHandler.js';

const cfg = typeof functions.config === 'function' ? functions.config() : {};
if (!process.env.FIREBASE_DB_URL && cfg?.smart?.firebase_db_url) {
  process.env.FIREBASE_DB_URL = cfg.smart.firebase_db_url;
}
if (!process.env.FIREBASE_AUTH_SECRET && cfg?.smart?.firebase_auth_secret) {
  process.env.FIREBASE_AUTH_SECRET = cfg.smart.firebase_auth_secret;
}
if (!process.env.ALLOWED_ORIGINS && cfg?.smart?.allowed_origins) {
  process.env.ALLOWED_ORIGINS = cfg.smart.allowed_origins;
}

const app = express();

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(compression());

app.use(cors({
  origin: (origin, callback) => {
    const allowList = process.env.ALLOWED_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean) || [];
    if (!origin) return callback(null, true);
    if (allowList.length === 0) return callback(null, true);
    if (allowList.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(morgan('combined'));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(sanitizationMiddleware);

app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes);

app.get('/metrics', (req, res) => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();

  const metrics = [
    `# HELP node_memory_heap_used_bytes Heap used in bytes`,
    `# TYPE node_memory_heap_used_bytes gauge`,
    `node_memory_heap_used_bytes ${memUsage.heapUsed}`,
    `# HELP node_memory_rss_bytes Resident set size in bytes`,
    `# TYPE node_memory_rss_bytes gauge`,
    `node_memory_rss_bytes ${memUsage.rss}`,
    `# HELP node_uptime_seconds Process uptime in seconds`,
    `# TYPE node_uptime_seconds counter`,
    `node_uptime_seconds ${uptime}`
  ].join('\n');

  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

app.use((req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
});

app.use(globalErrorHandler);

export const api = functions.https.onRequest(app);

