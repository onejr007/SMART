/// <reference types="vite/client" />
declare module '*/utils/binary-protocol.js';
declare module '*/utils/relational-validator.js';
declare module '*/utils/memoizer.js';
declare module '*/utils/error-tracker.js';
declare module '*/utils/cache-manager.js';
declare module '*/utils/worker-pool.js';
declare module '*/utils/secret-manager.js';
declare module '*/utils/throttling-middleware.js';

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
