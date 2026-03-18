// 11. Service Worker untuk offline cache
export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;

  async register(scriptURL = '/sw.js'): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register(scriptURL);
      console.log('Service Worker registered:', this.registration.scope);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  async unregister(): Promise<void> {
    if (this.registration) {
      await this.registration.unregister();
      this.registration = null;
    }
  }

  async update(): Promise<void> {
    if (this.registration) {
      await this.registration.update();
    }
  }

  onUpdateAvailable(callback: () => void): void {
    if (!this.registration) return;

    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration!.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            callback();
          }
        });
      }
    });
  }
}
