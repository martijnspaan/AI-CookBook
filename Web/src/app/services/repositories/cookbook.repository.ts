import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseRepository } from './base-repository';
import { IndexedDBService } from '../offline/indexeddb.service';
import { ConnectivityService } from '../offline/connectivity.service';
import { SyncService } from '../offline/sync.service';
import { Cookbook, CreateCookbookRequest, UpdateCookbookRequest } from '../../models/cookbook.model';

/**
 * Cookbook repository implementing offline-first data access
 * Extends BaseRepository with cookbook-specific operations
 */
@Injectable({
  providedIn: 'root'
})
export class CookbookRepository extends BaseRepository<Cookbook> {
  protected readonly entityType = 'cookbook' as const;
  protected readonly apiBaseUrl = '/api/cookbooks';

  constructor(
    httpClient: HttpClient,
    indexedDB: IndexedDBService,
    connectivity: ConnectivityService,
    sync: SyncService
  ) {
    super(httpClient, indexedDB, connectivity, sync);
  }

  /**
   * Get all cookbooks using cache-first strategy
   */
  getAllCookbooks(): Observable<Cookbook[]> {
    return this.getAllFromCacheFirst();
  }

  /**
   * Get cookbook by ID using cache-first strategy
   */
  getCookbookById(cookbookId: string): Observable<Cookbook | null> {
    return this.getByIdFromCacheFirst(cookbookId);
  }

  /**
   * Create new cookbook with offline support
   */
  createNewCookbook(cookbookRequest: CreateCookbookRequest): Observable<Cookbook> {
    return this.createEntityWithOfflineSupport(cookbookRequest).pipe(
      map(cookbook => cookbook!)
    );
  }

  /**
   * Update existing cookbook with offline support
   */
  updateExistingCookbook(cookbookId: string, cookbookRequest: UpdateCookbookRequest): Observable<Cookbook> {
    return this.updateEntityWithOfflineSupport(cookbookId, cookbookRequest).pipe(
      map(cookbook => cookbook!)
    );
  }

  /**
   * Delete cookbook with offline support
   */
  deleteCookbookById(cookbookId: string): Observable<void> {
    return this.deleteEntityWithOfflineSupport(cookbookId);
  }

  /**
   * Search cookbooks by title (local search only for offline support)
   */
  searchCookbooksByTitle(searchTerm: string): Observable<Cookbook[]> {
    return new Observable(observer => {
      this.indexedDB.getAllCookbooks().then(allCookbooks => {
        const filteredCookbooks = allCookbooks.filter(cookbook =>
          cookbook.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        observer.next(filteredCookbooks);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Search cookbooks by author (local search only for offline support)
   */
  searchCookbooksByAuthor(authorName: string): Observable<Cookbook[]> {
    return new Observable(observer => {
      this.indexedDB.getAllCookbooks().then(allCookbooks => {
        const filteredCookbooks = allCookbooks.filter(cookbook =>
          cookbook.author.toLowerCase().includes(authorName.toLowerCase())
        );
        observer.next(filteredCookbooks);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Get cookbooks that haven't been synced yet
   */
  getUnsyncedCookbooks(): Observable<Cookbook[]> {
    return new Observable(observer => {
      this.indexedDB.getAllCookbooks().then(allCookbooks => {
        const unsyncedCookbooks = allCookbooks.filter(cookbook => 
          cookbook.isDirty || !cookbook.lastSyncAt
        );
        observer.next(unsyncedCookbooks);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Force refresh cookbooks from server
   */
  forceRefreshFromServer(): Observable<Cookbook[]> {
    if (this.connectivity.isOffline) {
      return new Observable(observer => {
        observer.error(new Error('Cannot refresh from server while offline'));
        observer.complete();
      });
    }

    return new Observable(observer => {
      this.indexedDB.getAllCookbooks().then(cachedCookbooks => {
        // Clear cookbooks from cache
        const clearPromises = cachedCookbooks.map(cookbook => 
          this.indexedDB.deleteCookbook(cookbook.id)
        );
        
        Promise.all(clearPromises).then(() => {
          this.getAllCookbooks().subscribe({
            next: (cookbooks) => {
              observer.next(cookbooks);
              observer.complete();
            },
            error: (error) => {
              observer.error(error);
            }
          });
        }).catch(error => {
          observer.error(error);
        });
      }).catch(error => {
        observer.error(error);
      });
    });
  }
}

