/**
 * @file api/routes.js
 * @description Centralized API routes for better organization
 */

import { Router } from 'express';
import AIContextManager from '../ai/context-manager.js';
import AITemplateEngine from '../ai/template-engine.js';
import VersionManager from '../ai/version-manager.js';
import PerformanceMonitor from '../ai/performance-monitor.js';
import AIErrorHandler from '../ai/error-handler.js';
import MetricsCollector from '../ai/metrics-collector.js';
import RateLimiter from '../ai/rate-limiter.js';
import RequestValidator from '../ai/request-validator.js';
import HealthChecker from '../ai/health-checker.js';
import { componentSchema, pageSchema, validateComponent, validatePage } from '../schemas/ai-schemas.js';
import { apiDocumentation } from './api-docs.js';
import { obfuscateFile } from '../ai/obfuscator.js';
import { evolveCode } from '../ai/self-evolving.js';
import { kmsEncrypt, kmsDecrypt } from '../ai/kms.js';
import { validateRequest } from './validator.js';
import { RelationalValidator } from '../utils/relational-validator.js';
import { cacheManager } from '../utils/cache-manager.js';
import { memoizer } from '../utils/memoizer.js';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes, scrypt as _scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { firebaseGet, firebasePost, firebasePut } from '../utils/firebase-rest.js';

const router = Router();
const aiContext = new AIContextManager();
const versionManager = new VersionManager();
const perfMonitor = new PerformanceMonitor();
const errorHandler = new AIErrorHandler();
const metricsCollector = new MetricsCollector();
const rateLimiter = new RateLimiter({ windowMs: 60000, maxRequests: 100 });
const requestValidator = new RequestValidator();
const healthChecker = new HealthChecker();

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_for_dev_only';
const scrypt = promisify(_scrypt);

// --- Auth Routes (Backend Recommendation #2: Secure Session Management) ---

router.post('/auth/login', async (req, res) => {
    const { userId, displayName } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: 'UserId is required' });
    }

    // Generate token
    const token = jwt.sign(
        { userId, displayName },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    // Set HttpOnly Cookie
    res.cookie('smart_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({ success: true, token, user: { userId, displayName } });
});

router.post('/auth/logout', (req, res) => {
    res.clearCookie('smart_token');
    res.json({ success: true });
});

router.get('/auth/me', (req, res) => {
    const token = req.cookies.smart_token;
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ user: decoded });
    } catch (err) {
        res.status(401).json({ error: 'Invalid session' });
    }
});

function issueSessionCookie(res, payload) {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.cookie('smart_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
    });

    return token;
}

function getSessionUser(req) {
    const token = req.cookies.smart_token;
    if (!token) return null;
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

function requireSession(req, res, next) {
    const user = getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    req.sessionUser = user;
    next();
}

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function makeUserId(email) {
    const normalized = normalizeEmail(email);
    if (!normalized) return null;
    return createHash('sha256').update(normalized).digest('hex').slice(0, 24);
}

async function hashPassword(password, saltHex) {
    const derivedKey = await scrypt(String(password || ''), Buffer.from(saltHex, 'hex'), 64);
    return Buffer.from(derivedKey).toString('hex');
}

function legacySimpleHash(str) {
    let hash = 0;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) {
        const char = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

async function verifyPassword(userData, password) {
    if (!userData) return { ok: false, upgraded: false };

    if (userData.passwordHash && userData.passwordSalt) {
        const computed = await hashPassword(password, userData.passwordSalt);
        const a = Buffer.from(String(userData.passwordHash), 'hex');
        const b = Buffer.from(String(computed), 'hex');
        if (a.length !== b.length) return { ok: false, upgraded: false };
        const ok = timingSafeEqual(a, b);
        return { ok, upgraded: false };
    }

    if (typeof userData.password === 'string') {
        const ok = legacySimpleHash(password) === userData.password;
        return { ok, upgraded: ok };
    }

    return { ok: false, upgraded: false };
}

async function upgradeLegacyPassword(userId, password) {
    const salt = randomBytes(16).toString('hex');
    const passwordHash = await hashPassword(password, salt);
    const existing = (await firebaseGet(`users/${userId}`)) || {};
    if (existing.password) {
        delete existing.password;
    }
    await firebasePut(`users/${userId}`, {
        ...existing,
        passwordHash,
        passwordSalt: salt,
        passwordVersion: 1,
        passwordAlgo: 'scrypt'
    });
}

router.post('/portal/auth/signup', async (req, res) => {
    try {
        const { email, password, displayName } = req.body || {};
        const normalizedEmail = normalizeEmail(email);
        const userId = makeUserId(normalizedEmail);

        if (!normalizedEmail || !password || !displayName || !userId) {
            return res.status(400).json({ error: 'Invalid payload' });
        }

        const existing = await firebaseGet(`users/${userId}`);
        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const salt = randomBytes(16).toString('hex');
        const passwordHash = await hashPassword(password, salt);
        const userRecord = {
            uid: userId,
            email: normalizedEmail,
            displayName: String(displayName).trim(),
            role: 'player',
            createdAt: new Date().toISOString(),
            passwordHash,
            passwordSalt: salt,
            passwordVersion: 1,
            passwordAlgo: 'scrypt'
        };

        await firebasePut(`users/${userId}`, userRecord);

        issueSessionCookie(res, { userId, displayName: userRecord.displayName, role: userRecord.role });
        res.json({ user: { uid: userId, email: userRecord.email, displayName: userRecord.displayName, role: userRecord.role } });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
});

router.post('/portal/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body || {};
        const normalizedEmail = normalizeEmail(email);
        const userId = makeUserId(normalizedEmail);
        if (!normalizedEmail || !password || !userId) {
            return res.status(400).json({ error: 'Invalid payload' });
        }

        const userData = await firebaseGet(`users/${userId}`);
        if (!userData) {
            return res.status(404).json({ error: 'User not found' });
        }

        const result = await verifyPassword(userData, password);
        if (!result.ok) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (result.upgraded) {
            await upgradeLegacyPassword(userId, password);
        }

        const displayName = userData.displayName || normalizedEmail;
        const role = userData.role || 'player';

        issueSessionCookie(res, { userId, displayName, role });
        res.json({ user: { uid: userId, email: userData.email || normalizedEmail, displayName, role } });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
});

router.post('/portal/auth/logout', (req, res) => {
    res.clearCookie('smart_token');
    res.json({ success: true });
});

router.get('/portal/games', async (req, res) => {
    try {
        const games = await firebaseGet('games');
        if (!games) return res.json([]);
        const list = Object.keys(games)
            .map((id) => ({ id, ...games[id] }))
            .filter((g) => !g?.isDeleted);
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        res.json(list);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
});

router.get('/portal/games/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const data = await firebaseGet(`games/${gameId}`);
        if (!data || data.isDeleted) {
            return res.status(404).json({ error: 'Game not found' });
        }
        res.json({ id: gameId, ...data });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
});

router.post('/portal/games', requireSession, async (req, res) => {
    try {
        const { title, scene, playerSchema, description } = req.body || {};
        if (!title || !scene) {
            return res.status(400).json({ error: 'Invalid payload' });
        }

        const sessionUser = req.sessionUser;
        const gameData = {
            title: String(title),
            description: description ? String(description) : 'A user generated world built in SMART Engine',
            author: sessionUser.displayName,
            authorId: sessionUser.userId,
            createdAt: new Date().toISOString(),
            version: '2.1',
            scene,
            playerSchema: playerSchema || { level: 1, coins: 0 }
        };

        const result = await firebasePost('games', gameData);
        res.status(201).json({ id: result?.name, ...gameData });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
});

router.put('/portal/user_game_data/:gameId', requireSession, async (req, res) => {
    try {
        const { gameId } = req.params;
        const { progressData } = req.body || {};
        if (!gameId || typeof progressData !== 'object' || progressData === null) {
            return res.status(400).json({ error: 'Invalid payload' });
        }

        const sessionUser = req.sessionUser;
        await firebasePut(`user_game_data/${sessionUser.userId}/${gameId}`, {
            ...progressData,
            lastUpdated: new Date().toISOString()
        });

        res.json({ success: true });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
});

router.get('/portal/user_game_data/:gameId', requireSession, async (req, res) => {
    try {
        const { gameId } = req.params;
        const sessionUser = req.sessionUser;
        const data = await firebaseGet(`user_game_data/${sessionUser.userId}/${gameId}`);
        res.json(data || null);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
});

router.post('/portal/audit', requireSession, async (req, res) => {
    try {
        const { action, metadata, status } = req.body || {};
        if (!action) return res.status(400).json({ error: 'Invalid payload' });
        const sessionUser = req.sessionUser;
        const auditLog = {
            timestamp: new Date().toISOString(),
            action: String(action),
            userId: sessionUser.userId,
            metadata: metadata ?? null,
            status: status === 'failure' ? 'failure' : 'success'
        };

        const result = await firebasePost('audit_logs', auditLog);
        res.status(201).json({ id: result?.name, ...auditLog });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
});

router.get('/portal/leaderboards/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const limit = Math.min(Number(req.query.limit || 10) || 10, 100);
        const data = await firebaseGet(`leaderboards/${gameId}`);
        if (!data) return res.json([]);

        const entries = Object.values(data)
            .filter((e) => e && typeof e.score === 'number')
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
        res.json(entries);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
});

router.post('/portal/leaderboards/:gameId/submit', requireSession, async (req, res) => {
    try {
        const { gameId } = req.params;
        const { score } = req.body || {};
        const numericScore = Number(score);
        if (!Number.isFinite(numericScore)) {
            return res.status(400).json({ error: 'Invalid payload' });
        }

        const sessionUser = req.sessionUser;
        const entry = {
            userId: sessionUser.userId,
            score: numericScore,
            timestamp: new Date().toISOString()
        };

        const existing = await firebaseGet(`leaderboards/${gameId}/${sessionUser.userId}`);
        if (existing?.score >= numericScore) {
            return res.json({ success: true, ignored: true });
        }

        await firebasePut(`leaderboards/${gameId}/${sessionUser.userId}`, entry);
        res.json({ success: true });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
});

// Lazy load heavy modules (Optimization #41)
let templateEngine = null;
const getTemplateEngine = async () => {
  if (!templateEngine) {
    const { default: AITemplateEngine } = await import('../ai/template-engine.js');
    templateEngine = new AITemplateEngine(aiContext);
  }
  return templateEngine;
};

const VALID_ENTITY_TYPES = new Set(['component', 'page']);

function resolveEntityPath(type, name) {
  if (!VALID_ENTITY_TYPES.has(type)) {
    return null;
  }
  const ext = type === 'component' ? '.js' : '.html';
  return path.join(process.cwd(), 'src', `${type}s`, `${name}${ext}`);
}

// Middleware: Rate limiting
router.use((req, res, next) => {
  const identifier = req.ip || req.connection.remoteAddress || 'unknown';
  const result = rateLimiter.check(identifier);
  
  res.setHeader('X-RateLimit-Limit', rateLimiter.maxRequests);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', result.resetAt);
  
  if (!result.allowed) {
    metricsCollector.recordError('rate_limit');
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000)
    });
  }
  
  next();
});

// Middleware: Request timing & metrics
router.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const success = res.statusCode < 400;
    metricsCollector.recordRequest(req.path, success, duration);
  });
  
  next();
});

// Middleware: AI Context initialization
router.use(async (req, res, next) => {
  try {
    await aiContext.ensureReady();
    next();
  } catch (error) {
    metricsCollector.recordError('context_init');
    res.status(500).json(errorHandler.handle(error, { endpoint: req.path }));
  }
});

// Health check with detailed metrics (Production Recommendation #31)
router.get('/health', async (req, res) => {
  const memUsage = process.memoryUsage();
  const metrics = metricsCollector.getMetrics();
  const healthChecks = await healthChecker.runAllChecks();
  
  const status = healthChecks.overall === 'healthy' ? 200 : 503;

  res.status(status).json({
    status: healthChecks.overall,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    environment: process.env.NODE_ENV || 'development',
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      cpuUsage: process.cpuUsage(),
      memory: {
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`
      }
    },
    metrics: {
      totalRequests: metrics.requests.total,
      errorCount: metrics.errors.total,
      successRate: metrics.requests.total > 0 
        ? `${((metrics.requests.success / metrics.requests.total) * 100).toFixed(2)}%`
        : '0%',
    },
    services: healthChecks.checks,
    frameworkVersion: '3.0.0-production-ready'
  });
});

// Get project structure with caching
router.get('/structure', async (req, res) => {
  try {
    const cached = cacheManager.get('structure');
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      metricsCollector.recordCacheHit(true);
      return res.json(cached);
    }

    metricsCollector.recordCacheHit(false);
    
    // Request Memoization for simultaneous requests (Optimization #44)
    const result = await memoizer.memoize('get_structure', async () => {
      const structure = await getProjectStructure();
      const aiAnalytics = aiContext.getAnalytics();
      return { 
        ...structure, 
        ai: aiAnalytics, 
        timestamp: Date.now() 
      };
    }, 2000); // 2s memoization for simultaneous requests

    cacheManager.set('structure', result);
    res.setHeader('X-Cache', 'MISS');
    res.json(result);
  } catch (error) {
    metricsCollector.recordError('structure_fetch');
    res.status(500).json(errorHandler.handle(error, { endpoint: '/structure' }));
  }
});

router.get('/ai/context', async (req, res) => {
  try {
    const context = aiContext.exportForAI();
    res.json(context);
  } catch (error) {
    res.status(500).json(errorHandler.handle(error, { endpoint: '/ai/context' }));
  }
});

router.get('/ai/analytics', async (req, res) => {
  try {
    const analyticsData = await memoizer.memoize('ai_analytics', async () => {
      const analytics = aiContext.getAnalytics();
      const perfSummary = perfMonitor.getSummary();
      const errorStats = errorHandler.getStats();
      const systemMetrics = metricsCollector.getMetrics();
      return {
        ...analytics,
        performance: perfSummary,
        errors: errorStats,
        system: systemMetrics
      };
    }, 5000); // 5s memoization (Optimization #44)

    res.json(analyticsData);
  } catch (error) {
    metricsCollector.recordError('analytics_fetch');
    res.status(500).json(errorHandler.handle(error, { endpoint: '/ai/analytics' }));
  }
});

router.get('/ai/contracts', (req, res) => {
  res.json({
    validation: {
      componentSchema,
      pageSchema
    },
    generationRules: {
      naming: 'PascalCase',
      componentTypes: componentSchema.properties.type.enum,
      pageLayouts: pageSchema.properties.layout.enum,
      recommendation: 'Gunakan batch generate untuk multi-file'
    },
    documentation: apiDocumentation
  });
});

router.post('/ai/suggest/component', async (req, res) => {
  try {
    const { description, type } = req.body;
    const suggestion = aiContext.suggestComponentName(type, description);
    const patterns = aiContext.getSuccessfulPatterns('component_creation');

    res.json({
      suggestedName: suggestion,
      patterns: patterns.slice(0, 5),
      recommendations: {
        type: type || 'ui',
        complexity: description?.length > 100 ? 'complex' : 'simple'
      }
    });
  } catch (error) {
    res.status(500).json(errorHandler.handle(error, { endpoint: '/ai/suggest/component' }));
  }
});

router.post('/generate/component', validateRequest('component'), RelationalValidator.validateAuthor(), async (req, res) => {
  const opId = `comp-${Date.now()}`;
  perfMonitor.start(opId, 'componentGeneration');

  try {
    // Additional validation
    const nameValidation = requestValidator.validateComponentName(req.body.name);
    if (!nameValidation.valid) {
      return res.status(400).json({ error: nameValidation.error });
    }

    const contentValidation = requestValidator.validateContent(req.body.content);
    if (!contentValidation.valid) {
      return res.status(400).json({ error: contentValidation.error });
    }

    const validation = validateComponent(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const { name, type, content, aiMetadata } = req.body;
    const filePath = path.join(process.cwd(), 'src', 'components', `${name}.js`);

    let isUpdate = false;
    let oldContent = null;
    try {
      oldContent = await fs.readFile(filePath, 'utf8');
      isUpdate = true;
    } catch {}

    const engine = await getTemplateEngine();
    const componentContent = engine.generateComponent(name, type, {
      content,
      aiMetadata
    });

    if (isUpdate && oldContent) {
      await versionManager.saveVersion(filePath, oldContent, {
        type: 'pre-update',
        componentName: name
      });
    }

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, componentContent, 'utf8');

    await versionManager.saveVersion(filePath, componentContent, {
      type: isUpdate ? 'update' : 'create',
      componentName: name,
      aiMetadata
    });

    if (isUpdate) {
      aiContext.updateComponent(name, {
        type,
        description: content,
        prompt: aiMetadata?.prompt || aiMetadata?.aiPrompt || 'Manual Generation',
        path: filePath
      });
    } else {
      aiContext.addComponent(name, {
        type,
        description: content,
        prompt: aiMetadata?.prompt || aiMetadata?.aiPrompt || 'Manual Generation',
        path: filePath
      });
    }

    aiContext.addPattern('component_creation', {
      name,
      type,
      contentLength: content?.length || 0,
      isUpdate
    }, true);

    cacheManager.delete('structure');
    metricsCollector.recordGeneration('component', perfMonitor.end(opId)?.duration);

    const metrics = perfMonitor.end(opId);

    res.json({
      success: true,
      path: `/components/${name}.js`,
      isUpdate,
      metrics
    });
  } catch (error) {
    perfMonitor.end(opId);
    metricsCollector.recordError('component_generation');
    aiContext.addPattern('component_creation', req.body, false);
    res.status(500).json(errorHandler.handle(error, { 
      endpoint: '/generate/component',
      body: req.body 
    }));
  }
});

router.post('/generate/page', validateRequest('page'), async (req, res) => {
  const opId = `page-${Date.now()}`;
  perfMonitor.start(opId, 'pageGeneration');

  try {
    // Additional validation
    const nameValidation = requestValidator.validateComponentName(req.body.name);
    if (!nameValidation.valid) {
      return res.status(400).json({ error: nameValidation.error });
    }

    const validation = validatePage(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const { name, components, layout, aiMetadata } = req.body;
    const filePath = path.join(process.cwd(), 'src', 'pages', `${name}.html`);

    const engine = await getTemplateEngine();
    const pageContent = engine.generatePage(name, layout, {
      components,
      meta: aiMetadata
    });

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, pageContent, 'utf8');

    await versionManager.saveVersion(filePath, pageContent, {
      type: 'create',
      pageName: name,
      aiMetadata
    });

    aiContext.addPage(name, {
      components,
      layout,
      aiMetadata: aiMetadata || {},
      filePath
    });

    cacheManager.delete('structure');
    metricsCollector.recordGeneration('page', perfMonitor.end(opId)?.duration);

    const metrics = perfMonitor.end(opId);

    res.json({
      success: true,
      path: `/pages/${name}.html`,
      metrics
    });
  } catch (error) {
    perfMonitor.end(opId);
    metricsCollector.recordError('page_generation');
    res.status(500).json(errorHandler.handle(error, { 
      endpoint: '/generate/page',
      body: req.body 
    }));
  }
});

router.get('/versions/:type/:name', async (req, res) => {
  try {
    const { type, name } = req.params;
    const filePath = resolveEntityPath(type, name);
    if (!filePath) {
      return res.status(400).json({ error: 'Invalid type. Use "component" or "page"' });
    }

    const versions = await versionManager.getVersions(filePath);
    res.json({ versions });
  } catch (error) {
    res.status(500).json(errorHandler.handle(error, { 
      endpoint: '/versions',
      params: req.params 
    }));
  }
});

router.post('/versions/restore', async (req, res) => {
  try {
    const { type, name, hash } = req.body;
    const filePath = resolveEntityPath(type, name);
    if (!filePath) {
      return res.status(400).json({ error: 'Invalid type. Use "component" or "page"' });
    }

    await versionManager.restoreVersion(filePath, hash);
    cacheManager.delete('structure');

    res.json({ success: true, message: 'Version restored successfully' });
  } catch (error) {
    res.status(500).json(errorHandler.handle(error, { 
      endpoint: '/versions/restore',
      body: req.body 
    }));
  }
});

router.post('/batch/generate', async (req, res) => {
  const opId = `batch-${Date.now()}`;
  perfMonitor.start(opId, 'batchGeneration');

  try {
    const { operations } = req.body;
    
    // Validate batch size
    const batchValidation = requestValidator.validateBatchSize(operations);
    if (!batchValidation.valid) {
      return res.status(400).json({ error: batchValidation.error });
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;
    
    const engine = await getTemplateEngine();

    for (const op of operations) {
      try {
        if (op.type === 'component') {
          const validation = validateComponent(op.data);
          if (validation.valid) {
            const { name, type, content, aiMetadata } = op.data;
            const componentContent = engine.generateComponent(name, type, {
              content,
              aiMetadata
            });
            
            const filePath = path.join(process.cwd(), 'src', 'components', `${name}.js`);
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, componentContent, 'utf8');
            aiContext.addComponent(name, {
              type,
              description: content,
              prompt: aiMetadata?.prompt || aiMetadata?.aiPrompt || 'Batch Generation',
              path: filePath
            });
            
            metricsCollector.recordGeneration('component');
            results.push({ success: true, name, path: `/components/${name}.js` });
            successCount++;
          } else {
            results.push({ success: false, name: op.data.name, errors: validation.errors });
            failCount++;
          }
        } else if (op.type === 'page') {
          const validation = validatePage(op.data);
          if (validation.valid) {
            const { name, components, layout, aiMetadata } = op.data;
            const pageContent = engine.generatePage(name, layout, {
              components,
              meta: aiMetadata
            });
            const filePath = path.join(process.cwd(), 'src', 'pages', `${name}.html`);
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, pageContent, 'utf8');
            aiContext.addPage(name, {
              components,
              layout,
              aiMetadata: aiMetadata || {},
              filePath
            });
            
            metricsCollector.recordGeneration('page');
            results.push({ success: true, name, path: `/pages/${name}.html` });
            successCount++;
          } else {
            results.push({ success: false, name: op.data.name, errors: validation.errors });
            failCount++;
          }
        } else {
          results.push({ success: false, name: op.data?.name, errors: ['Unsupported operation type'] });
          failCount++;
        }
      } catch (error) {
        results.push({ success: false, name: op.data?.name, error: error.message });
        failCount++;
      }
    }

    clearCache('structure');
    const metrics = perfMonitor.end(opId);

    res.json({ 
      results, 
      summary: {
        total: operations.length,
        success: successCount,
        failed: failCount
      },
      metrics 
    });
  } catch (error) {
    perfMonitor.end(opId);
    metricsCollector.recordError('batch_generation');
    res.status(500).json(errorHandler.handle(error, { endpoint: '/batch/generate' }));
  }
});

// Bridge API: Menghubungkan Web Chat dengan IDE Agent (Trae/Kiro/dll)
router.post('/ide-bridge/chat', async (req, res) => {
  try {
    const { message, ide } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // 1. Catat pesan dari web ke dalam file log/instruksi khusus
    // IDE Agent seperti Trae dapat membaca file ini (baik secara manual maupun lewat linter/watcher)
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [WEB -> ${ide || 'AGENT'}] ${message}\n`;
    
    const triggerFile = path.join(process.cwd(), '.agent-trigger.md');
    
    // Tambahkan pesan ke file trigger
    await fs.appendFile(triggerFile, logEntry, 'utf8');

    // 2. Beri tahu frontend bahwa pesan telah diteruskan ke IDE
    res.json({ 
      success: true, 
      status: 'Message forwarded to IDE Agent',
      file_updated: '.agent-trigger.md'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Autonomous AI Endpoints
router.post('/autonomous/chat-evolve', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // SIMULASI AI ROUTING & INTENT DISCOVERY
    // Di dunia nyata, prompt ini akan dikirim ke OpenAI/Anthropic untuk mencari tahu file mana yang harus diedit
    let targetFile = '';
    let instruction = prompt;

    const lowerPrompt = prompt.toLowerCase();
    
    // Heuristic sederhana (pengganti LLM call)
    if (lowerPrompt.includes('index') || lowerPrompt.includes('utama') || lowerPrompt.includes('dashboard')) {
      targetFile = 'public/index.html';
    } else if (lowerPrompt.includes('style') || lowerPrompt.includes('warna') || lowerPrompt.includes('css')) {
      targetFile = 'public/css/main.css';
    } else if (lowerPrompt.includes('test')) {
      targetFile = 'test-evolve.txt';
    } else {
      // Jika AI tidak tahu file mana yang dituju
      return res.status(400).json({ 
        success: false, 
        message: 'Maaf, saya tidak tahu file mana yang harus diubah berdasarkan pesan Anda. Coba sebutkan halamannya (misal: "di halaman utama" atau "di index").' 
      });
    }

    // Panggil fungsi evolusi kode
    const result = await evolveCode(targetFile, instruction);
    
    // Generate AI conversational response
    let chatResponse = '';
    if (lowerPrompt.includes('test')) {
      chatResponse = `Halo! Saya menerima perintah test Anda. Saya telah menyisipkan log pengujian ke dalam file ${targetFile}. Silakan cek file tersebut di IDE Anda!`;
    } else if (targetFile === 'public/index.html') {
      chatResponse = `Baik, saya telah memodifikasi struktur halaman utama sesuai permintaan Anda. Anda bisa melihat perubahannya langsung di file ${targetFile}.`;
    } else {
      chatResponse = `Instruksi Anda ("${instruction}") telah saya kerjakan. File ${targetFile} berhasil saya perbarui.`;
    }

    res.json({
      ...result,
      modified_file: targetFile,
      chat_response: chatResponse
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/autonomous/evolve', async (req, res) => {
  try {
    const { filePath, instruction } = req.body;
    if (!filePath || !instruction) {
      return res.status(400).json({ error: 'filePath and instruction required' });
    }
    const result = await evolveCode(filePath, instruction);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/autonomous/obfuscate', async (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: 'filePath required' });
    }
    const success = await obfuscateFile(filePath);
    res.json({ success, file: filePath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/autonomous/kms/encrypt', (req, res) => {
  try {
    const { payload } = req.body;
    const encrypted = kmsEncrypt(payload);
    res.json({ encrypted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/autonomous/kms/decrypt', (req, res) => {
  try {
    const { payload } = req.body;
    const decrypted = kmsDecrypt(payload);
    res.json({ decrypted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function
async function getProjectStructure() {
  const structure = {
    components: [],
    pages: [],
    assets: []
  };

  try {
    const components = await fs.readdir('src/components');
    structure.components = components.filter(f => f.endsWith('.js') && f !== '.gitkeep');
  } catch (e) {}

  try {
    const pages = await fs.readdir('src/pages');
    structure.pages = pages.filter(f => f.endsWith('.html') && f !== '.gitkeep');
  } catch (e) {}

  return structure;
}

export default router;
export { 
  aiContext, 
  templateEngine, 
  versionManager, 
  perfMonitor, 
  errorHandler,
  metricsCollector,
  rateLimiter,
  requestValidator,
  healthChecker
};
