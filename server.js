/**
 * @file server-v2.js
 * @description Enhanced AI-Friendly Web Framework Server v2.0
 * @features Performance optimization, versioning, error handling, batch operations
 */

import express from 'express';
import compression from 'compression';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import chokidar from 'chokidar';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './utils/logger.js';
import apiRoutes from './api/routes.js';
import { startGrpcServer } from './grpc/server.js';
import { globalErrorHandler, NotFoundError } from './api/errorHandler.js';
import { sanitizationMiddleware } from './utils/sanitizer.js';
import { BinaryProtocol } from './utils/binary-protocol.js';
import { throttlingMiddleware } from './utils/throttling-middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ 
  server,
  verifyClient: (info, callback) => {
    // Networking Recommendation #7: WebSocket Authentication (Enhanced with Cookies)
    const url = new URL(info.req.url, `http://${info.req.headers.host}`);
    let token = url.searchParams.get('token');

    // Fallback to cookie for better security (Backend Recommendation #2)
    if (!token && info.req.headers.cookie) {
        const cookies = info.req.headers.cookie.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
        }, {});
        token = cookies['smart_token'];
    }

    if (!token) {
      logger.warn('WebSocket connection rejected: Missing token');
      return callback(false, 401, 'Unauthorized');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_for_dev_only');
      info.req.user = decoded;
      callback(true);
    } catch (err) {
      logger.warn('WebSocket connection rejected: Invalid token', { error: err.message });
      callback(false, 401, 'Unauthorized');
    }
  }
});

// Security & Performance Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.gstatic.com", "https://apis.google.com", "https://www.googletagmanager.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://firebasestorage.googleapis.com"],
      connectSrc: ["'self'", "ws:", "wss:", "https://*.firebaseio.com", "https://*.firebasedatabase.app", "https://*.googleapis.com", "https://www.google-analytics.com", "https://www.googletagmanager.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://*.firebaseapp.com"]
    },
  },
}));
app.use(compression());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true
}));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(throttlingMiddleware); // Networking Recommendation #9

// Advanced Rate Limiting (Backend Recommendation #2)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many requests from this IP, please try again in 15 minutes'
  }
});
app.use('/api/', limiter);

// Body parsing with strict limits (Security Recommendation #9)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(sanitizationMiddleware); // Database Recommendation #15

// Static files with caching
app.use(express.static('dist', { 
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store');
    }
  }
}));
app.use('/components', express.static('src/components', { maxAge: '5m' }));
app.use('/pages', express.static('src/pages', { maxAge: '5m' }));

// Headers
app.use((req, res, next) => {
  res.setHeader('X-SMART-Engine', 'SMART-Metaverse');
  res.setHeader('X-Powered-By', 'SMART-Engine');
  next();
});

// Request timing
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`⚠️ Slow request: ${req.method} ${req.path} (${duration}ms)`);
    }
  });
  next();
});

// API Routes with Versioning (Security Recommendation #1)
app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes); // Backward compatibility for now

// Production #25: Prometheus-style Metrics for Resource Monitoring
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
    `node_uptime_seconds ${uptime}`,
    
    `# HELP websocket_active_clients Current number of active WebSocket clients`,
    `# TYPE websocket_active_clients gauge`,
    `websocket_active_clients ${clients.size}`
  ].join('\n');
  
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

// WebSocket for hot reload & real-time logging
const clients = new Set();
const rooms = new Map(); // Room storage (Networking Recommendation #2)

// Networking Recommendation #2: Heartbeat Logic
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      logger.info('Terminate dead connection');
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('connection', (ws, req) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  
  // Assign to room based on query param (e.g., ?gameId=...)
  const url = new URL(req.url, `http://${req.headers.host}`);
  const gameId = url.searchParams.get('gameId') || 'global';
  ws.gameId = gameId;

  if (!rooms.has(gameId)) {
    rooms.set(gameId, new Set());
  }
  rooms.get(gameId).add(ws);

  clients.add(ws);
  logger.info('✅ Client connected', { 
    userId: req.user?.userId, 
    gameId: gameId,
    totalClients: clients.size 
  });

  ws.on('message', (message) => {
    try {
      let data;
      // Networking Recommendation #5: Binary Data Transmission (MessagePack)
      if (Buffer.isBuffer(message) || message instanceof ArrayBuffer || ArrayBuffer.isView(message)) {
        data = BinaryProtocol.decode(Buffer.from(message));
      } else {
        data = JSON.parse(message.toString());
      }
      
      // Handle Room Broadcast
      if (data.type === 'broadcast' && ws.gameId) {
        broadcastToRoom(ws.gameId, data.payload, ws, data.binary);
      }
    } catch (e) {
      logger.error('WS Message Error:', e);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    if (ws.gameId && rooms.has(ws.gameId)) {
      rooms.get(ws.gameId).delete(ws);
      if (rooms.get(ws.gameId).size === 0) rooms.delete(ws.gameId);
    }
    logger.info('❌ Client disconnected', { totalClients: clients.size });
  });

  ws.on('error', (error) => {
    logger.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Broadcast to all connected clients
function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === 1) {
      try {
        client.send(message);
      } catch (error) {
        logger.error('Failed to send to client:', error);
      }
    }
  });
}

// Room-based broadcast (Networking Recommendation #2)
function broadcastToRoom(gameId, data, sender = null, useBinary = false) {
  const message = useBinary ? BinaryProtocol.encode(data) : JSON.stringify(data);
  const roomClients = rooms.get(gameId);
  
  if (roomClients) {
    roomClients.forEach((client) => {
      if (client !== sender && client.readyState === 1) {
        try {
          client.send(message, { binary: useBinary });
        } catch (error) {
          logger.error(`Failed to send to client in room ${gameId}:`, error);
        }
      }
    });
  }
}

// File watcher for hot reload
const watcher = chokidar.watch(['src/**/*', 'public/**/*'], {
  ignored: /node_modules/,
  persistent: true,
  ignoreInitial: true
});

watcher.on('change', (path) => {
  console.log(`📝 File changed: ${path}`);
  broadcast({ type: 'reload', path, timestamp: Date.now() });
});

watcher.on('add', (path) => {
  console.log(`➕ File added: ${path}`);
  broadcast({ type: 'reload', path, timestamp: Date.now() });
});

watcher.on('unlink', (path) => {
  console.log(`➖ File removed: ${path}`);
  broadcast({ type: 'reload', path, timestamp: Date.now() });
});

app.get('*', (req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api') || req.path.startsWith('/metrics')) return next();

  const accept = req.headers.accept || '';
  if (!accept.includes('text/html')) return next();

  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (!fs.existsSync(indexPath)) return next();

  res.sendFile(indexPath);
});

// 404 handler (Security Recommendation #10)
app.use((req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
});

// Global Error handling middleware (Security Recommendation #10)
app.use(globalErrorHandler);

// Graceful shutdown (Security Recommendation #7)
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  clearInterval(interval);
  server.close(() => {
    logger.info('Server closed');
    watcher.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('\nSIGINT received, shutting down gracefully...');
  clearInterval(interval);
  server.close(() => {
    logger.info('Server closed');
    watcher.close();
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                                                        ║');
  console.log('║       🎮 SMART METAVERSE ENGINE v1.0 - READY          ║');
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 HTTP Server running at: http://localhost:${PORT}`);
  
  // Start gRPC Server
  const grpcPort = process.env.GRPC_PORT || 50051;
  startGrpcServer(grpcPort);
  
  console.log(`🔥 Hot reload: ACTIVE`);
  console.log(`📊 Performance monitoring: ENABLED`);
  console.log(`💾 Version control: ENABLED`);
  console.log(`🛡️  Security: Rate limiting + Helmet`);
  console.log(`⚡ Batch operations: SUPPORTED`);
  console.log(`📈 Metrics collection: ACTIVE`);
  console.log('');
  console.log('📝 API Endpoints:');
  console.log(`   GET  /api/health              - Health check + metrics`);
  console.log(`   GET  /api/structure           - Project structure (cached)`);
  console.log(`   GET  /api/ai/context          - AI context`);
  console.log(`   GET  /api/ai/analytics        - System analytics`);
  console.log(`   GET  /api/ai/contracts        - Schemas + API docs`);
  console.log(`   POST /api/generate/component  - Generate component`);
  console.log(`   POST /api/generate/page       - Generate page`);
  console.log(`   POST /api/batch/generate      - Batch generation (max 50)`);
  console.log(`   GET  /api/versions/:type/:name - Version history`);
  console.log(`   POST /api/versions/restore    - Restore version`);
  console.log('');
  console.log('🎯 Ready for SMART Metaverse operations!');
  console.log('');
});

export { broadcast };
