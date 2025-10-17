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
    
    // Check for updates on page load and when app becomes visible
    if (this.swUpdate.isEnabled) {
      this.checkForUpdatesOnPageLoad();
      this.setupVisibilityChangeListener();
    }
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
      // Check for updates periodically (every 5 minutes)
      // This provides a reasonable balance between responsiveness and performance
      const checkInterval = 5 * 60 * 1000; // 5 minutes
      
      setInterval(() => {
        this.swUpdate.checkForUpdate();
      }, checkInterval);

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

  /**
   * Check for updates on page load and handle them intelligently
   */
  private async checkForUpdatesOnPageLoad(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    try {
      const updateFound = await this.swUpdate.checkForUpdate();
      
      if (updateFound) {
        console.log('Update found on page load');
        
        // Check if this is a fresh page load (not a navigation within the app)
        const isFreshPageLoad = performance.navigation?.type === 0 || 
                               performance.navigation?.type === 1;
        
        if (isFreshPageLoad) {
          // For fresh page loads, automatically activate the update
          console.log('Fresh page load detected - activating update automatically');
          await this.swUpdate.activateUpdate();
          // Don't reload here as the user just loaded the page
        } else {
          // For navigation within the app, prompt the user
          console.log('Navigation detected - prompting user for update');
          this.promptUserUpdate();
        }
      }
    } catch (error) {
      console.error('Error checking for updates on page load:', error);
    }
  }

  /**
   * Setup listener for when the app becomes visible (user switches back to tab)
   */
  private setupVisibilityChangeListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.swUpdate.isEnabled) {
        console.log('App became visible - checking for updates');
        this.swUpdate.checkForUpdate();
      }
    });
  }

  /**
   * Manually check for updates
   */
  async checkForUpdates(): Promise<boolean> {
    if (this.swUpdate.isEnabled) {
      try {
        console.log('Manual update check started...');
        const updateFound = await this.swUpdate.checkForUpdate();
        console.log('Manual update check completed. Update found:', updateFound);
        
        if (updateFound) {
          console.log('Update found, attempting to activate...');
          await this.swUpdate.activateUpdate();
          console.log('Update activated, reloading page...');
          window.location.reload();
        }
        
        return updateFound;
      } catch (error) {
        console.error('Error checking for updates:', error);
        return false;
      }
    } else {
      console.log('Service worker updates are not enabled');
      return false;
    }
  }

  /**
   * Force check for updates and apply immediately
   */
  async forceCheckAndUpdate(): Promise<void> {
    console.log('Force checking for updates...');
    try {
      const updateFound = await this.checkForUpdates();
      if (!updateFound) {
        console.log('No updates found');
      }
    } catch (error) {
      console.error('Error in force check and update:', error);
    }
  }

  /**
   * Clear service worker cache and force reload
   */
  async clearCacheAndReload(): Promise<void> {
    console.log('Clearing service worker cache...');
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          // Clear all caches
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
          console.log('All caches cleared');
          
          // Unregister current service worker
          await registration.unregister();
          console.log('Service worker unregistered');
          
          // Reload the page to trigger fresh registration
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Force a hard refresh bypassing cache
   */
  forceHardRefresh(): void {
    console.log('Forcing hard refresh...');
    // Clear all caches and reload
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
        (window as any).location.reload();
      });
    } else {
      (window as any).location.reload();
    }
  }

  /**
   * Expose methods to window for console access
   */
  exposeToWindow(): void {
    (window as any).pwaService = {
      clearCacheAndReload: () => this.clearCacheAndReload(),
      forceHardRefresh: () => this.forceHardRefresh(),
      forceCheckAndUpdate: () => this.forceCheckAndUpdate(),
      checkForUpdates: () => this.checkForUpdates()
    };
    console.log('PWA service methods exposed to window.pwaService');
  }
}

