import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, from, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { IndexedDBService } from '../offline/indexeddb.service';
import { ConnectivityService } from '../offline/connectivity.service';
import { SyncService } from '../offline/sync.service';

/**
 * Base repository class implementing offline-first data access pattern
 * Provides cache-first strategy: IndexedDB → API → IndexedDB → Return
 */
@Injectable()
export abstract class BaseRepository<T> {
  protected abstract readonly entityType: 'recipe' | 'cookbook' | 'groceryList' | 'weekMenu';
  protected abstract readonly apiBaseUrl: string;

  constructor(
    protected readonly httpClient: HttpClient,
    protected readonly indexedDB: IndexedDBService,
    protected readonly connectivity: ConnectivityService,
    protected readonly sync: SyncService
  ) {}

  /**
   * Get all entities using cache-first strategy
   */
  protected getAllFromCacheFirst(): Observable<T[]> {
    return from(this.getAllEntitiesFromIndexedDB()).pipe(
      switchMap(cachedEntities => {
        // If we have cached data and we're offline, return cached data
        if (this.connectivity.isOffline && cachedEntities.length > 0) {
          console.log(`Returning ${cachedEntities.length} cached ${this.entityType}s (offline)`);
          return of(cachedEntities);
        }

        // If we have cached data and we're online, return cached data immediately
        // and fetch fresh data in the background
        if (cachedEntities.length > 0 && this.connectivity.isOnline) {
          console.log(`Returning ${cachedEntities.length} cached ${this.entityType}s, fetching fresh data in background`);
          this.fetchAndCacheAllFromServer().subscribe({
            next: () => console.log(`Background refresh of ${this.entityType}s completed`),
            error: (error) => console.error(`Background refresh of ${this.entityType}s failed:`, error)
          });
          return of(cachedEntities);
        }

        // If no cached data and we're online, fetch from server
        if (this.connectivity.isOnline) {
          console.log(`No cached ${this.entityType}s found, fetching from server`);
          return this.fetchAndCacheAllFromServer();
        }

        // If no cached data and we're offline, return empty array
        console.log(`No cached ${this.entityType}s found and offline`);
        return of([]);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get entity by ID using cache-first strategy
   */
  protected getByIdFromCacheFirst(id: string): Observable<T | null> {
    return from(this.getEntityByIdFromIndexedDB(id)).pipe(
      switchMap(cachedEntity => {
        // If we have cached data and we're offline, return cached data
        if (this.connectivity.isOffline && cachedEntity) {
          console.log(`Returning cached ${this.entityType} ${id} (offline)`);
          return of(cachedEntity);
        }

        // If we have cached data and we're online, return cached data immediately
        // and fetch fresh data in the background
        if (cachedEntity && this.connectivity.isOnline) {
          console.log(`Returning cached ${this.entityType} ${id}, fetching fresh data in background`);
          this.fetchAndCacheByIdFromServer(id).subscribe({
            next: () => console.log(`Background refresh of ${this.entityType} ${id} completed`),
            error: (error) => console.error(`Background refresh of ${this.entityType} ${id} failed:`, error)
          });
          return of(cachedEntity);
        }

        // If no cached data and we're online, fetch from server
        if (this.connectivity.isOnline) {
          console.log(`No cached ${this.entityType} ${id} found, fetching from server`);
          return this.fetchAndCacheByIdFromServer(id);
        }

        // If no cached data and we're offline, return null
        console.log(`No cached ${this.entityType} ${id} found and offline`);
        return of(null);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Create entity with offline support
   */
  protected createEntityWithOfflineSupport(entityData: any): Observable<T> {
    // Generate temporary ID for offline operations
    const tempId = this.generateTempId();
    const entityWithTempId = { ...entityData, id: tempId };

    // Save to IndexedDB immediately for offline access
    return from(this.saveEntityToCache(entityWithTempId)).pipe(
      switchMap(() => {
        // If online, try to sync with server
        if (this.connectivity.isOnline) {
          console.log(`Creating ${this.entityType} on server`);
          return this.httpClient.post<T>(this.apiBaseUrl, entityData).pipe(
            tap(async (serverEntity) => {
              // Update local cache with server response
              await this.saveEntityToCache({ ...serverEntity, lastSyncAt: new Date() });
              console.log(`${this.entityType} created and synced with server`);
            }),
            catchError((error) => {
              console.error(`Failed to create ${this.entityType} on server, will retry when online:`, error);
              // Add to sync queue for later retry
              this.addToSyncQueue('CREATE', tempId, entityData);
              // Return the locally cached entity
              return from(this.indexedDB.getEntityById<T>(this.entityType, tempId));
            })
          );
        } else {
          console.log(`${this.entityType} created offline, will sync when online`);
          // Add to sync queue for when we come back online
          this.addToSyncQueue('CREATE', tempId, entityData);
          // Return the locally cached entity
          return from(this.indexedDB.getEntityById<T>(this.entityType, tempId));
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Update entity with offline support
   */
  protected updateEntityWithOfflineSupport(id: string, entityData: any): Observable<T> {
    // Update local cache immediately
    return from(this.saveEntityToCache({ ...entityData, id, isDirty: true })).pipe(
      switchMap(() => {
        // If online, try to sync with server
        if (this.connectivity.isOnline) {
          console.log(`Updating ${this.entityType} ${id} on server`);
          return this.httpClient.put<T>(`${this.apiBaseUrl}/${id}`, entityData).pipe(
            tap(async (serverEntity) => {
              // Update local cache with server response
              await this.saveEntityToCache({ ...serverEntity, lastSyncAt: new Date(), isDirty: false });
              console.log(`${this.entityType} ${id} updated and synced with server`);
            }),
            catchError((error) => {
              console.error(`Failed to update ${this.entityType} ${id} on server, will retry when online:`, error);
              // Add to sync queue for later retry
              this.addToSyncQueue('UPDATE', id, entityData);
              // Return the locally cached entity
              return from(this.indexedDB.getEntityById<T>(this.entityType, id));
            })
          );
        } else {
          console.log(`${this.entityType} ${id} updated offline, will sync when online`);
          // Add to sync queue for when we come back online
          this.addToSyncQueue('UPDATE', id, entityData);
          // Return the locally cached entity
          return from(this.indexedDB.getEntityById<T>(this.entityType, id));
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Delete entity with offline support
   */
  protected deleteEntityWithOfflineSupport(id: string): Observable<void> {
    // Delete from local cache immediately
    return from(this.deleteEntityFromCache(id)).pipe(
      switchMap(() => {
        // If online, try to sync with server
        if (this.connectivity.isOnline) {
          console.log(`Deleting ${this.entityType} ${id} from server`);
          return this.httpClient.delete<void>(`${this.apiBaseUrl}/${id}`).pipe(
            tap(() => {
              console.log(`${this.entityType} ${id} deleted and synced with server`);
            }),
            catchError((error) => {
              console.error(`Failed to delete ${this.entityType} ${id} from server, will retry when online:`, error);
              // Add to sync queue for later retry
              this.addToSyncQueue('DELETE', id);
              // Return void since we already deleted locally
              return of(void 0);
            })
          );
        } else {
          console.log(`${this.entityType} ${id} deleted offline, will sync when online`);
          // Add to sync queue for when we come back online
          this.addToSyncQueue('DELETE', id);
          // Return void since we already deleted locally
          return of(void 0);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Fetch all entities from server and cache them
   */
  private fetchAndCacheAllFromServer(): Observable<T[]> {
    return this.httpClient.get<T[]>(this.apiBaseUrl).pipe(
      tap(async (entities) => {
        console.log(`Fetched ${entities.length} ${this.entityType}s from server, caching...`);
        for (const entity of entities) {
          await this.saveEntityToCache({ ...entity, lastSyncAt: new Date() });
        }
        await this.indexedDB.setLastSyncTime(this.entityType);
        console.log(`Cached ${entities.length} ${this.entityType}s`);
      }),
      catchError((error) => {
        console.error(`Failed to fetch ${this.entityType}s from server:`, error);
        // Return empty array if server fetch fails
        return of([]);
      })
    );
  }

  /**
   * Fetch entity by ID from server and cache it
   */
  private fetchAndCacheByIdFromServer(id: string): Observable<T | null> {
    return this.httpClient.get<T>(`${this.apiBaseUrl}/${id}`).pipe(
      tap(async (entity) => {
        console.log(`Fetched ${this.entityType} ${id} from server, caching...`);
        await this.saveEntityToCache({ ...entity, lastSyncAt: new Date() });
        console.log(`Cached ${this.entityType} ${id}`);
      }),
      catchError((error) => {
        console.error(`Failed to fetch ${this.entityType} ${id} from server:`, error);
        // Return null if server fetch fails
        return of(null);
      })
    );
  }

  /**
   * Save entity to cache
   */
  private async saveEntityToCache(entity: any): Promise<void> {
    switch (this.entityType) {
      case 'recipe':
        await this.indexedDB.saveRecipe(entity);
        break;
      case 'cookbook':
        await this.indexedDB.saveCookbook(entity);
        break;
      case 'groceryList':
        await this.indexedDB.saveGroceryList(entity);
        break;
      case 'weekMenu':
        await this.indexedDB.saveWeekMenu(entity);
        break;
    }
  }

  /**
   * Delete entity from cache
   */
  private async deleteEntityFromCache(id: string): Promise<void> {
    switch (this.entityType) {
      case 'recipe':
        await this.indexedDB.deleteRecipe(id);
        break;
      case 'cookbook':
        await this.indexedDB.deleteCookbook(id);
        break;
      case 'groceryList':
        await this.indexedDB.deleteGroceryList(id);
        break;
      case 'weekMenu':
        await this.indexedDB.deleteWeekMenu(id);
        break;
    }
  }

  /**
   * Add operation to sync queue
   */
  private async addToSyncQueue(type: 'CREATE' | 'UPDATE' | 'DELETE', entityId: string, data?: any): Promise<void> {
    await this.indexedDB.addToSyncQueue({
      type,
      entityType: this.entityType,
      entityId,
      data
    });
  }

  /**
   * Generate temporary ID for offline operations
   */
  private generateTempId(): string {
    return `temp_${this.entityType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all entities from IndexedDB based on entity type
   */
  private async getAllEntitiesFromIndexedDB(): Promise<T[]> {
    switch (this.entityType) {
      case 'recipe':
        return await this.indexedDB.getAllRecipes() as T[];
      case 'cookbook':
        return await this.indexedDB.getAllCookbooks() as T[];
      case 'groceryList':
        return await this.indexedDB.getAllGroceryLists() as T[];
      case 'weekMenu':
        return await this.indexedDB.getAllWeekMenus() as T[];
      default:
        throw new Error(`Unknown entity type: ${this.entityType}`);
    }
  }

  /**
   * Get entity by ID from IndexedDB based on entity type
   */
  private async getEntityByIdFromIndexedDB(id: string): Promise<T | null> {
    switch (this.entityType) {
      case 'recipe':
        return await this.indexedDB.getRecipeById(id) as T | null;
      case 'cookbook':
        return await this.indexedDB.getCookbookById(id) as T | null;
      case 'groceryList':
        return await this.indexedDB.getGroceryListById(id) as T | null;
      case 'weekMenu':
        return await this.indexedDB.getWeekMenuById(id) as T | null;
      default:
        throw new Error(`Unknown entity type: ${this.entityType}`);
    }
  }

  /**
   * Handle errors consistently
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      errorMessage = `Server error: ${error.status} - ${error.message}`;
    }
    
    console.error(`${this.entityType} repository error:`, errorMessage);
    return throwError(() => new Error(errorMessage));
  };
}
