import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

/**
 * Service to monitor network connectivity status
 * Provides real-time updates about online/offline state
 */
@Injectable({
  providedIn: 'root'
})
export class ConnectivityService {
  private readonly onlineStatusSubject = new BehaviorSubject<boolean>(navigator.onLine);
  private readonly connectionTypeSubject = new BehaviorSubject<string>('unknown');

  public readonly isOnline$: Observable<boolean>;
  public readonly isOffline$: Observable<boolean>;
  public readonly connectionType$: Observable<string>;

  constructor() {
    // Initialize observables
    this.isOnline$ = this.onlineStatusSubject.asObservable().pipe(
      distinctUntilChanged()
    );
    
    this.isOffline$ = this.isOnline$.pipe(
      map(isOnline => !isOnline)
    );
    
    this.connectionType$ = this.connectionTypeSubject.asObservable();

    // Set up network event listeners
    this.setupNetworkListeners();
    
    // Detect connection type if available
    this.detectConnectionType();
  }

  /**
   * Get current online status synchronously
   */
  get isOnline(): boolean {
    return this.onlineStatusSubject.value;
  }

  /**
   * Get current offline status synchronously
   */
  get isOffline(): boolean {
    return !this.onlineStatusSubject.value;
  }

  /**
   * Get current connection type
   */
  get connectionType(): string {
    return this.connectionTypeSubject.value;
  }

  /**
   * Set up listeners for online/offline events
   */
  private setupNetworkListeners(): void {
    // Listen to online/offline events
    const onlineEvent$ = fromEvent(window, 'online').pipe(
      map(() => true)
    );
    
    const offlineEvent$ = fromEvent(window, 'offline').pipe(
      map(() => false)
    );

    // Merge online and offline events
    merge(onlineEvent$, offlineEvent$).subscribe(isOnline => {
      this.onlineStatusSubject.next(isOnline);
      
      if (isOnline) {
        console.log('Network connection restored');
        this.detectConnectionType();
      } else {
        console.log('Network connection lost');
      }
    });
  }

  /**
   * Detect the current connection type
   */
  private detectConnectionType(): void {
    // Check if Connection API is available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        this.connectionTypeSubject.next(connection.effectiveType || connection.type || 'unknown');
        return;
      }
    }

    // Fallback to 'unknown' if Connection API is not available
    this.connectionTypeSubject.next('unknown');
  }

  /**
   * Check if the connection is fast enough for real-time operations
   * Returns true if connection is 4g or faster, or if we can't detect the type
   */
  isFastConnection(): boolean {
    const connectionType = this.connectionType;
    
    if (connectionType === 'unknown') {
      return true; // Assume fast if we can't detect
    }
    
    const fastTypes = ['4g', '5g'];
    return fastTypes.includes(connectionType);
  }

  /**
   * Check if the connection is suitable for background sync
   * Returns true if connection is 3g or faster, or if we can't detect the type
   */
  isSuitableForBackgroundSync(): boolean {
    const connectionType = this.connectionType;
    
    if (connectionType === 'unknown') {
      return true; // Assume suitable if we can't detect
    }
    
    const suitableTypes = ['3g', '4g', '5g'];
    return suitableTypes.includes(connectionType);
  }

  /**
   * Wait for network to come online
   * Returns a Promise that resolves when the network is available
   */
  waitForOnline(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isOnline) {
        resolve();
        return;
      }

      const subscription = this.isOnline$.subscribe(isOnline => {
        if (isOnline) {
          subscription.unsubscribe();
          resolve();
        }
      });
    });
  }

  /**
   * Wait for network to go offline
   * Returns a Promise that resolves when the network is unavailable
   */
  waitForOffline(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isOffline) {
        resolve();
        return;
      }

      const subscription = this.isOffline$.subscribe(isOffline => {
        if (isOffline) {
          subscription.unsubscribe();
          resolve();
        }
      });
    });
  }

  /**
   * Check if we should attempt to sync data based on connection quality
   */
  shouldAttemptSync(): boolean {
    return this.isOnline && this.isSuitableForBackgroundSync();
  }

  /**
   * Get a human-readable description of the current connection status
   */
  getConnectionStatusDescription(): string {
    if (this.isOffline) {
      return 'Offline';
    }

    const connectionType = this.connectionType;
    switch (connectionType) {
      case 'slow-2g':
        return 'Slow connection (2G)';
      case '2g':
        return 'Basic connection (2G)';
      case '3g':
        return 'Good connection (3G)';
      case '4g':
        return 'Fast connection (4G)';
      case '5g':
        return 'Very fast connection (5G)';
      default:
        return 'Online';
    }
  }
}

