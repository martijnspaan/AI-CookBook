import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseRepository } from './base-repository';
import { IndexedDBService } from '../offline/indexeddb.service';
import { ConnectivityService } from '../offline/connectivity.service';
import { SyncService } from '../offline/sync.service';
import { GroceryList, CreateGroceryListRequest, UpdateIngredientStateRequest } from '../../models/grocery-list.model';

/**
 * Grocery List repository implementing offline-first data access
 * Extends BaseRepository with grocery list-specific operations
 */
@Injectable({
  providedIn: 'root'
})
export class GroceryListRepository extends BaseRepository<GroceryList> {
  protected readonly entityType = 'groceryList' as const;
  protected readonly apiBaseUrl = '/api/grocerylists';

  constructor(
    httpClient: HttpClient,
    indexedDB: IndexedDBService,
    connectivity: ConnectivityService,
    sync: SyncService
  ) {
    super(httpClient, indexedDB, connectivity, sync);
  }

  /**
   * Get all grocery lists using cache-first strategy
   */
  getAllGroceryLists(): Observable<GroceryList[]> {
    return this.getAllFromCacheFirst();
  }

  /**
   * Get grocery list by ID using cache-first strategy
   */
  getGroceryListById(groceryListId: string): Observable<GroceryList | null> {
    return this.getByIdFromCacheFirst(groceryListId);
  }

  /**
   * Get grocery list by date using cache-first strategy
   */
  getGroceryListByDate(date: string): Observable<GroceryList | null> {
    return new Observable(observer => {
      this.indexedDB.getGroceryListByDate(date).then(groceryList => {
        if (groceryList) {
          observer.next(groceryList);
        } else if (this.connectivity.isOnline) {
          // Try to fetch from server if not in cache
          this.httpClient.get<GroceryList>(`${this.apiBaseUrl}?date=${date}`).subscribe({
            next: async (serverGroceryList) => {
              await this.indexedDB.saveGroceryList({ ...serverGroceryList, lastSyncAt: new Date() });
              observer.next(serverGroceryList);
              observer.complete();
            },
            error: (error) => {
              console.log(`No grocery list found for date ${date}`);
              observer.next(null);
              observer.complete();
            }
          });
        } else {
          observer.next(null);
          observer.complete();
        }
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Create grocery list with offline support
   */
  createGroceryList(groceryListRequest: CreateGroceryListRequest): Observable<GroceryList> {
    return this.createEntityWithOfflineSupport(groceryListRequest);
  }

  /**
   * Update grocery list with offline support
   */
  updateGroceryList(groceryListId: string, groceryListRequest: CreateGroceryListRequest): Observable<GroceryList> {
    return this.updateEntityWithOfflineSupport(groceryListId, groceryListRequest);
  }

  /**
   * Delete grocery list with offline support
   */
  deleteGroceryList(groceryListId: string): Observable<void> {
    return this.deleteEntityWithOfflineSupport(groceryListId);
  }

  /**
   * Update ingredient state with offline support
   */
  updateIngredientState(groceryListId: string, ingredientStateRequest: UpdateIngredientStateRequest): Observable<GroceryList> {
    return new Observable(observer => {
      // Get current grocery list
      this.getGroceryListById(groceryListId).subscribe({
        next: async (groceryList) => {
          if (!groceryList) {
            observer.error(new Error(`Grocery list with ID ${groceryListId} not found`));
            return;
          }

          // Update ingredient state locally
          const updatedIngredientsState = groceryList.ingredientsState.map(ingredient => 
            ingredient.ingredientName === ingredientStateRequest.ingredientName
              ? { ...ingredient, state: ingredientStateRequest.state }
              : ingredient
          );

          const updatedGroceryList = {
            ...groceryList,
            ingredientsState: updatedIngredientsState,
            isDirty: true
          };

          // Save to cache immediately
          await this.indexedDB.saveGroceryList(updatedGroceryList);

          // If online, try to sync with server
          if (this.connectivity.isOnline) {
            this.httpClient.put<GroceryList>(
              `${this.apiBaseUrl}/${groceryListId}/ingredient-state`,
              ingredientStateRequest
            ).subscribe({
              next: async (serverGroceryList) => {
                await this.indexedDB.saveGroceryList({ ...serverGroceryList, lastSyncAt: new Date(), isDirty: false });
                observer.next(serverGroceryList);
                observer.complete();
              },
              error: (error) => {
                console.error(`Failed to update ingredient state on server, will retry when online:`, error);
                // Add to sync queue for later retry
                this.addToSyncQueue('UPDATE', groceryListId, updatedGroceryList);
                observer.next(updatedGroceryList);
                observer.complete();
              }
            });
          } else {
            console.log(`Ingredient state updated offline, will sync when online`);
            // Add to sync queue for when we come back online
            this.addToSyncQueue('UPDATE', groceryListId, updatedGroceryList);
            observer.next(updatedGroceryList);
            observer.complete();
          }
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  /**
   * Get grocery lists that haven't been synced yet
   */
  getUnsyncedGroceryLists(): Observable<GroceryList[]> {
    return new Observable(observer => {
      this.indexedDB.getAllGroceryLists().then(allGroceryLists => {
        const unsyncedGroceryLists = allGroceryLists.filter(groceryList => 
          groceryList.isDirty || !groceryList.lastSyncAt
        );
        observer.next(unsyncedGroceryLists);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Get grocery lists by date range
   */
  getGroceryListsByDateRange(startDate: string, endDate: string): Observable<GroceryList[]> {
    return new Observable(observer => {
      this.indexedDB.getAllGroceryLists().then(allGroceryLists => {
        const filteredGroceryLists = allGroceryLists.filter(groceryList => {
          const groceryDate = new Date(groceryList.dayOfGrocery);
          const start = new Date(startDate);
          const end = new Date(endDate);
          return groceryDate >= start && groceryDate <= end;
        });
        observer.next(filteredGroceryLists);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Force refresh grocery lists from server
   */
  forceRefreshFromServer(): Observable<GroceryList[]> {
    if (this.connectivity.isOffline) {
      return new Observable(observer => {
        observer.error(new Error('Cannot refresh from server while offline'));
        observer.complete();
      });
    }

    return new Observable(observer => {
      this.indexedDB.getAllGroceryLists().then(cachedGroceryLists => {
        // Clear grocery lists from cache
        const clearPromises = cachedGroceryLists.map(groceryList => 
          this.indexedDB.deleteGroceryList(groceryList.id)
        );
        
        Promise.all(clearPromises).then(() => {
          this.getAllGroceryLists().subscribe({
            next: (groceryLists) => {
              observer.next(groceryLists);
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

  /**
   * Add to sync queue (protected method from base class)
   */
  private async addToSyncQueue(type: 'CREATE' | 'UPDATE' | 'DELETE', entityId: string, data?: any): Promise<void> {
    await this.indexedDB.addToSyncQueue({
      type,
      entityType: this.entityType,
      entityId,
      data
    });
  }
}

