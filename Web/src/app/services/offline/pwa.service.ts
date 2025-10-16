import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, map } from 'rxjs/operators';

/**
 * Service for managing PWA installation, updates, and offline functionality
 */
@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private deferredPrompt: any = null;
  private isInstallable = false;

  constructor(private swUpdate: SwUpdate) {
    this.setupInstallPrompt();
    this.setupUpdateNotifications();
  }

  /**
   * Check if the app can be installed
   */
  get canInstall(): boolean {
    return this.isInstallable;
  }

  /**
   * Get the deferred install prompt
   */
  get installPrompt(): any {
    return this.deferredPrompt;
  }

  /**
   * Setup install prompt listener
   */
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA install prompt triggered');
      e.preventDefault();
      this.deferredPrompt = e;
      this.isInstallable = true;
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.deferredPrompt = null;
      this.isInstallable = false;
    });
  }

  /**
   * Setup service worker update notifications
   */
  private setupUpdateNotifications(): void {
    if (this.swUpdate.isEnabled) {
      // Check for updates every 6 hours
      setInterval(() => {
        this.swUpdate.checkForUpdate();
      }, 6 * 60 * 60 * 1000);

      // Listen for available updates
      this.swUpdate.versionUpdates
        .pipe(
          filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
          map(evt => ({
            type: 'UPDATE_AVAILABLE',
            current: evt.currentVersion,
            available: evt.latestVersion,
          }))
        )
        .subscribe(update => {
          console.log('Update available:', update);
          this.promptUserUpdate();
        });
    }
  }

  /**
   * Prompt user to install the PWA
   */
  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('No install prompt available');
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted PWA installation');
        this.deferredPrompt = null;
        this.isInstallable = false;
        return true;
      } else {
        console.log('User dismissed PWA installation');
        return false;
      }
    } catch (error) {
      console.error('Error during PWA installation:', error);
      return false;
    }
  }

  /**
   * Prompt user to update the app
   */
  private promptUserUpdate(): void {
    if (confirm('A new version of the app is available. Would you like to update?')) {
      this.swUpdate.activateUpdate().then(() => {
        console.log('App updated successfully');
        window.location.reload();
      });
    }
  }

  /**
   * Check if the app is running as a PWA
   */
  isRunningAsPwa(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Check if the app is running on iOS
   */
  isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  /**
   * Show iOS installation instructions
   */
  showIOSInstallInstructions(): void {
    const instructions = `
      To install this app on your iOS device:
      1. Tap the Share button in Safari
      2. Tap "Add to Home Screen"
      3. Tap "Add" to confirm
    `;
    alert(instructions);
  }

  /**
   * Get device capabilities for offline functionality
   */
  getDeviceCapabilities(): {
    hasIndexedDB: boolean;
    hasServiceWorker: boolean;
    hasPushNotifications: boolean;
    hasBackgroundSync: boolean;
  } {
    return {
      hasIndexedDB: 'indexedDB' in window,
      hasServiceWorker: 'serviceWorker' in navigator,
      hasPushNotifications: 'PushManager' in window,
      hasBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype
    };
  }

  /**
   * Check if offline functionality is fully supported
   */
  isOfflineFullySupported(): boolean {
    const capabilities = this.getDeviceCapabilities();
    return capabilities.hasIndexedDB && capabilities.hasServiceWorker;
  }

  /**
   * Register for push notifications (if supported)
   */
  async registerForPushNotifications(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY' // Replace with actual VAPID key
      });

      console.log('Push notification subscription:', subscription);
      return true;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return false;
    }
  }

  /**
   * Get app version information
   */
  getAppVersion(): string {
    return '1.0.0'; // This could be dynamically retrieved from package.json
  }

  /**
   * Check if the app needs to be updated
   */
  async checkForUpdates(): Promise<boolean> {
    if (this.swUpdate.isEnabled) {
      try {
        const updateAvailable = await this.swUpdate.checkForUpdate();
        return updateAvailable;
      } catch (error) {
        console.error('Error checking for updates:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Force update the app
   */
  async forceUpdate(): Promise<void> {
    if (this.swUpdate.isEnabled) {
      try {
        await this.swUpdate.activateUpdate();
        window.location.reload();
      } catch (error) {
        console.error('Error forcing update:', error);
      }
    }
  }
}

