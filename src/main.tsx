import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './portal/App'
import './index.css'
import { ServiceWorkerManager } from './engine/ServiceWorkerManager'
import { OverlayProvider } from './portal/ui/OverlayProvider'

const clearServiceWorkerInDev = async () => {
  if (!('serviceWorker' in navigator)) return;
  const alreadyCleared = sessionStorage.getItem('sw-cleared') === '1';
  if (alreadyCleared) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  if (registrations.length === 0) return;

  await Promise.all(registrations.map((r) => r.unregister()));

  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }

  sessionStorage.setItem('sw-cleared', '1');
  window.location.reload();
};

if (import.meta.env.DEV) {
  clearServiceWorkerInDev();
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const swManager = new ServiceWorkerManager();
  swManager
    .register('/sw.js')
    .then(() => {
      console.log('✅ Service Worker registered successfully');
    })
    .catch((error) => {
      console.error('❌ Service Worker registration failed:', error);
    });

  swManager.onUpdateAvailable(() => {
    console.log('🔄 New version available! Reload to update.');
    window.dispatchEvent(new Event('app:sw-update'));
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <OverlayProvider>
      <App />
    </OverlayProvider>
  </React.StrictMode>,
)
