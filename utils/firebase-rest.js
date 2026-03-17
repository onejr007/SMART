import logger from './logger.js';
import { secretManager } from './secret-manager.js';

let cachedConfig = null;

async function getConfig() {
  if (cachedConfig) return cachedConfig;

  const dbUrl = await secretManager.getSecret('FIREBASE_DB_URL');
  const authSecret = await secretManager.getSecret('FIREBASE_AUTH_SECRET');

  if (!dbUrl) {
    throw new Error('Missing FIREBASE_DB_URL');
  }
  if (!authSecret) {
    throw new Error('Missing FIREBASE_AUTH_SECRET');
  }

  cachedConfig = {
    dbUrl: dbUrl.replace(/\/+$/, ''),
    authSecret
  };
  return cachedConfig;
}

function normalizePath(dbPath) {
  const cleaned = String(dbPath || '').trim().replace(/^\/+/, '').replace(/\.json$/i, '');
  if (!cleaned) {
    throw new Error('Invalid Firebase path');
  }
  return cleaned;
}

async function request(method, dbPath, body) {
  const { dbUrl, authSecret } = await getConfig();
  const normalized = normalizePath(dbPath);
  const url = `${dbUrl}/${normalized}.json?auth=${encodeURIComponent(authSecret)}`;

  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    logger.warn('Firebase REST error', {
      method,
      path: normalized,
      status: res.status,
      body: typeof data === 'object' && data ? data : text
    });
    const message = typeof data === 'object' && data?.error ? data.error : `Firebase request failed (${res.status})`;
    const err = new Error(message);
    err.statusCode = res.status;
    throw err;
  }

  return data;
}

export async function firebaseGet(dbPath) {
  return request('GET', dbPath);
}

export async function firebasePut(dbPath, body) {
  return request('PUT', dbPath, body);
}

export async function firebasePost(dbPath, body) {
  return request('POST', dbPath, body);
}

export async function firebasePatch(dbPath, body) {
  return request('PATCH', dbPath, body);
}

