import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, from } from 'rxjs';
import { catchError, switchMap, tap, filter } from 'rxjs/operators';
import { IndexedDBService } from './indexeddb.service';
import { ConnectivityService } from './connectivity.service';
import { SyncOperation } from './indexeddb.service';

/**
 * Service for handling background synchronization of offline data
 * Manages sync queue and coordinates data synchronization with the server
 */
@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private readonly SYNC_INTERVAL_MS = 3600000; // 3600 seconds
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY_MS = 5000; // 5 seconds

  private readonly syncStatusSubject = new BehaviorSubject<'idle' | 'syncing' | 'error'>('idle');
  private readonly lastSyncTimeSubject = new BehaviorSubject<Date | null>(null);
  private readonly syncErrorSubject = new BehaviorSubject<string | null>(null);

  public readonly syncStatus$: Observable<'idle' | 'syncing' | 'error'>;
  public readonly lastSyncTime$: Observable<Date | null>;
  public readonly syncError$: Observable<string | null>;

  constructor(
    private readonly httpClient: HttpClient,
    private readonly indexedDB: IndexedDBService,
    private readonly connectivity: ConnectivityService
  ) {
    this.syncStatus$ = this.syncStatusSubject.asObservable();
    this.lastSyncTime$ = this.lastSyncTimeSubject.asObservable();
    this.syncError$ = this.syncErrorSubject.asObservable();

    this.initializeSync();
  }

  /**
   * Initialize automatic synchronization
   */
  private initializeSync(): void {
    // Sync when coming online
    this.connectivity.isOnline$.pipe(
      filter(isOnline => isOnline),
      tap(() => console.log('Network restored, starting sync...'))
    ).subscribe(() => {
      this.performSync();
    });

    // Periodic sync when online
    interval(this.SYNC_INTERVAL_MS).pipe(
      filter(() => this.connectivity.shouldAttemptSync()),
      switchMap(() => from(this.performSync()))
    ).subscribe();
  }

  /**
   * Perform full synchronization
   */
  async performSync(): Promise<void> {
    if (!this.connectivity.shouldAttemptSync()) {
      console.log('Skipping sync - network not suitable');
      return;
    }

    try {
      this.syncStatusSubject.next('syncing');
      this.syncErrorSubject.next(null);

      console.log('Starting synchronization...');

      // Sync pending operations first
      await this.syncPendingOperations();

      // Sync data from server to local storage
      await this.syncFromServer();

      // Update last sync time
      this.lastSyncTimeSubject.next(new Date());

      console.log('Synchronization completed successfully');
      this.syncStatusSubject.next('idle');

    } catch (error) {
      console.error('Synchronization failed:', error);
      this.syncErrorSubject.next(error instanceof Error ? error.message : 'Unknown sync error');
      this.syncStatusSubject.next('error');
    }
  }

  /**
   * Sync pending operations from local to server
   */
  private async syncPendingOperations(): Promise<void> {
    const pendingOperations = await this.indexedDB.getPendingSyncOperations();
    
    if (pendingOperations.length === 0) {
      console.log('No pending operations to sync');
      return;
    }

    console.log(`Syncing ${pendingOperations.length} pending operations...`);

    for (const operation of pendingOperations) {
      try {
        await this.syncOperation(operation);
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);
        await this.handleSyncError(operation, error);
      }
    }
  }

  /**
   * Sync a single operation to the server
   */
  private async syncOperation(operation: SyncOperation): Promise<void> {
    console.log(`Syncing operation: ${operation.type} ${operation.entityType} ${operation.entityId}`);

    // Update operation status to syncing
    await this.indexedDB.updateSyncOperationStatus(operation.id, 'SYNCING');

    let result: any;

    switch (operation.entityType) {
      case 'recipe':
        result = await this.syncRecipeOperation(operation);
        break;
      case 'cookbook':
        result = await this.syncCookbookOperation(operation);
        break;
      case 'groceryList':
        result = await this.syncGroceryListOperation(operation);
        break;
      case 'weekMenu':
        result = await this.syncWeekMenuOperation(operation);
        break;
      default:
        throw new Error(`Unknown entity type: ${operation.entityType}`);
    }

    // Update local data with server response if available
    if (result) {
      await this.updateLocalData(operation.entityType, result);
    }

    // Mark operation as completed and remove from queue
    await this.indexedDB.updateSyncOperationStatus(operation.id, 'COMPLETED');
    await this.indexedDB.removeSyncOperation(operation.id);

    console.log(`Successfully synced operation: ${operation.id}`);
  }

  /**
   * Sync recipe operation
   */
  private async syncRecipeOperation(operation: SyncOperation): Promise<any> {
    const apiBaseUrl = '/api/recipes';
    
    switch (operation.type) {
      case 'CREATE':
        return await this.httpClient.post(apiBaseUrl, operation.data).toPromise();
      case 'UPDATE':
        return await this.httpClient.put(`${apiBaseUrl}/${operation.entityId}`, operation.data).toPromise();
      case 'DELETE':
        await this.httpClient.delete(`${apiBaseUrl}/${operation.entityId}`).toPromise();
        return null;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Sync cookbook operation
   */
  private async syncCookbookOperation(operation: SyncOperation): Promise<any> {
    const apiBaseUrl = '/api/cookbooks';
    
    switch (operation.type) {
      case 'CREATE':
        return await this.httpClient.post(apiBaseUrl, operation.data).toPromise();
      case 'UPDATE':
        return await this.httpClient.put(`${apiBaseUrl}/${operation.entityId}`, operation.data).toPromise();
      case 'DELETE':
        await this.httpClient.delete(`${apiBaseUrl}/${operation.entityId}`).toPromise();
        return null;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Sync grocery list operation
   */
  private async syncGroceryListOperation(operation: SyncOperation): Promise<any> {
    const apiBaseUrl = '/api/grocerylists';
    
    switch (operation.type) {
      case 'CREATE':
        return await this.httpClient.post(apiBaseUrl, operation.data).toPromise();
      case 'UPDATE':
        return await this.httpClient.put(`${apiBaseUrl}/${operation.entityId}`, operation.data).toPromise();
      case 'DELETE':
        await this.httpClient.delete(`${apiBaseUrl}/${operation.entityId}`).toPromise();
        return null;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Sync week menu operation
   */
  private async syncWeekMenuOperation(operation: SyncOperation): Promise<any> {
    const apiBaseUrl = '/api/weekmenus';
    
    switch (operation.type) {
      case 'CREATE':
      case 'UPDATE':
        return await this.httpClient.post(apiBaseUrl, operation.data).toPromise();
      case 'DELETE':
        await this.httpClient.delete(`${apiBaseUrl}/${operation.entityId}`).toPromise();
        return null;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Update local data with server response
   */
  private async updateLocalData(entityType: string, serverData: any): Promise<void> {
    switch (entityType) {
      case 'recipe':
        await this.indexedDB.saveRecipe({ ...serverData, lastSyncAt: new Date() });
        break;
      case 'cookbook':
        await this.indexedDB.saveCookbook({ ...serverData, lastSyncAt: new Date() });
        break;
      case 'groceryList':
        await this.indexedDB.saveGroceryList({ ...serverData, lastSyncAt: new Date() });
        break;
      case 'weekMenu':
        await this.indexedDB.saveWeekMenu({ ...serverData, lastSyncAt: new Date() });
        break;
    }
  }

  /**
   * Handle sync error and retry logic
   */
  private async handleSyncError(operation: SyncOperation, error: any): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (operation.retryCount < this.MAX_RETRY_ATTEMPTS) {
      console.log(`Retrying operation ${operation.id} (attempt ${operation.retryCount + 1}/${this.MAX_RETRY_ATTEMPTS})`);
      
      await this.indexedDB.updateSyncOperationStatus(
        operation.id, 
        'PENDING', 
        errorMessage
      );

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY_MS));
    } else {
      console.error(`Operation ${operation.id} failed after ${this.MAX_RETRY_ATTEMPTS} attempts`);
      await this.indexedDB.updateSyncOperationStatus(
        operation.id, 
        'FAILED', 
        errorMessage
      );
    }
  }

  /**
   * Sync data from server to local storage
   */
  private async syncFromServer(): Promise<void> {
    console.log('Syncing data from server...');

    try {
      // Sync recipes
      await this.syncRecipesFromServer();
      
      // Sync cookbooks
      await this.syncCookbooksFromServer();
      
      // Sync grocery lists
      await this.syncGroceryListsFromServer();
      
      // Sync week menus
      await this.syncWeekMenusFromServer();

      console.log('Server sync completed');
    } catch (error) {
      console.error('Server sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync recipes from server
   */
  private async syncRecipesFromServer(): Promise<void> {
    try {
      const recipes = await this.httpClient.get('/api/recipes').toPromise() as any[];
      for (const recipe of recipes) {
        await this.indexedDB.saveRecipe({ ...recipe, lastSyncAt: new Date() });
      }
      await this.indexedDB.setLastSyncTime('recipes');
    } catch (error) {
      console.error('Failed to sync recipes:', error);
    }
  }

  /**
   * Sync cookbooks from server
   */
  private async syncCookbooksFromServer(): Promise<void> {
    try {
      const cookbooks = await this.httpClient.get('/api/cookbooks').toPromise() as any[];
      for (const cookbook of cookbooks) {
        await this.indexedDB.saveCookbook({ ...cookbook, lastSyncAt: new Date() });
      }
      await this.indexedDB.setLastSyncTime('cookbooks');
    } catch (error) {
      console.error('Failed to sync cookbooks:', error);
    }
  }

  /**
   * Sync grocery lists from server
   */
  private async syncGroceryListsFromServer(): Promise<void> {
    try {
      const groceryLists = await this.httpClient.get('/api/grocerylists').toPromise() as any[];
      for (const groceryList of groceryLists) {
        await this.indexedDB.saveGroceryList({ ...groceryList, lastSyncAt: new Date() });
      }
      await this.indexedDB.setLastSyncTime('groceryLists');
    } catch (error) {
      console.error('Failed to sync grocery lists:', error);
    }
  }

  /**
   * Sync week menus from server
   */
  private async syncWeekMenusFromServer(): Promise<void> {
    try {
      const weekMenus = await this.httpClient.get('/api/weekmenus').toPromise() as any[];
      for (const weekMenu of weekMenus) {
        await this.indexedDB.saveWeekMenu({ ...weekMenu, lastSyncAt: new Date() });
      }
      await this.indexedDB.setLastSyncTime('weekMenus');
    } catch (error) {
      console.error('Failed to sync week menus:', error);
    }
  }

  /**
   * Force immediate synchronization
   */
  async forceSync(): Promise<void> {
    console.log('Force sync requested');
    await this.performSync();
  }

  /**
   * Clear all sync errors
   */
  clearSyncError(): void {
    this.syncErrorSubject.next(null);
    this.syncStatusSubject.next('idle');
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): 'idle' | 'syncing' | 'error' {
    return this.syncStatusSubject.value;
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): Date | null {
    return this.lastSyncTimeSubject.value;
  }

  /**
   * Get current sync error
   */
  getSyncError(): string | null {
    return this.syncErrorSubject.value;
  }
}

