import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseRepository } from './base-repository';
import { IndexedDBService } from '../offline/indexeddb.service';
import { ConnectivityService } from '../offline/connectivity.service';
import { SyncService } from '../offline/sync.service';
import { 
  WeekMenu, 
  CreateOrUpdateWeekMenuRequest, 
  CreateOrUpdateWeekMenuResponse 
} from '../../models/week-menu.model';

/**
 * Week Menu repository implementing offline-first data access
 * Extends BaseRepository with week menu-specific operations
 */
@Injectable({
  providedIn: 'root'
})
export class WeekMenuRepository extends BaseRepository<WeekMenu> {
  protected readonly entityType = 'weekMenu' as const;
  protected readonly apiBaseUrl = '/api/weekmenus';

  constructor(
    httpClient: HttpClient,
    indexedDB: IndexedDBService,
    connectivity: ConnectivityService,
    sync: SyncService
  ) {
    super(httpClient, indexedDB, connectivity, sync);
  }

  /**
   * Get all week menus using cache-first strategy
   */
  getWeekMenus(): Observable<WeekMenu[]> {
    return this.getAllFromCacheFirst();
  }

  /**
   * Get week menu by ID using cache-first strategy
   */
  getWeekMenuById(weekMenuId: string): Observable<WeekMenu | null> {
    return this.getByIdFromCacheFirst(weekMenuId);
  }

  /**
   * Get week menu by week number and year using cache-first strategy
   */
  getWeekMenuByWeekAndYear(weekNumber: number, year: number): Observable<WeekMenu | null> {
    return new Observable(observer => {
      this.indexedDB.getWeekMenuByWeekAndYear(weekNumber, year).then(weekMenu => {
        if (weekMenu) {
          observer.next(weekMenu);
        } else if (this.connectivity.isOnline) {
          // Try to fetch from server if not in cache
          this.httpClient.get<WeekMenu[]>(`${this.apiBaseUrl}?weekNumber=${weekNumber}&year=${year}`).subscribe({
            next: async (serverWeekMenus) => {
              if (serverWeekMenus && serverWeekMenus.length > 0) {
                const serverWeekMenu = serverWeekMenus[0];
                await this.indexedDB.saveWeekMenu({ ...serverWeekMenu, lastSyncAt: new Date() });
                observer.next(serverWeekMenu);
              } else {
                observer.next(null);
              }
              observer.complete();
            },
            error: (error) => {
              console.log(`No week menu found for week ${weekNumber}, year ${year}`);
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
   * Create or update week menu with offline support
   */
  createOrUpdateWeekMenu(request: CreateOrUpdateWeekMenuRequest): Observable<CreateOrUpdateWeekMenuResponse> {
    // Generate temporary ID for new week menus
    const tempId = request.weekNumber && request.year ? 
      `temp_week_${request.year}_${request.weekNumber}_${Date.now()}` : 
      this.generateTempId();
    
    const weekMenuWithTempId = { 
      ...request, 
      id: tempId 
    };

    // Save to IndexedDB immediately for offline access
    return new Observable(observer => {
      this.indexedDB.saveWeekMenu({ ...weekMenuWithTempId, isDirty: true }).then(() => {
        // If online, try to sync with server
        if (this.connectivity.isOnline) {
          console.log(`Creating/updating week menu on server`);
          this.httpClient.post<CreateOrUpdateWeekMenuResponse>(this.apiBaseUrl, request).subscribe({
            next: async (serverResponse) => {
              // Update local cache with server response
              await this.indexedDB.saveWeekMenu({ 
                ...serverResponse, 
                lastSyncAt: new Date(), 
                isDirty: false 
              });
              console.log(`Week menu created/updated and synced with server`);
              observer.next(serverResponse);
              observer.complete();
            },
            error: (error) => {
              console.error(`Failed to create/update week menu on server, will retry when online:`, error);
              // Add to sync queue for later retry
              this.addToSyncQueue('CREATE', tempId, request);
              // Return the locally cached response
              const localResponse: CreateOrUpdateWeekMenuResponse = {
                id: tempId,
                weekNumber: request.weekNumber,
                year: request.year,
                weekDays: request.weekDays
              };
              observer.next(localResponse);
              observer.complete();
            }
          });
        } else {
          console.log(`Week menu created/updated offline, will sync when online`);
          // Add to sync queue for when we come back online
          this.addToSyncQueue('CREATE', tempId, request);
          // Return the locally cached response
          const localResponse: CreateOrUpdateWeekMenuResponse = {
            id: tempId,
            weekNumber: request.weekNumber,
            year: request.year,
            weekDays: request.weekDays
          };
          observer.next(localResponse);
          observer.complete();
        }
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Get week menus that haven't been synced yet
   */
  getUnsyncedWeekMenus(): Observable<WeekMenu[]> {
    return new Observable(observer => {
      this.indexedDB.getAllWeekMenus().then(allWeekMenus => {
        const unsyncedWeekMenus = allWeekMenus.filter(weekMenu => 
          weekMenu.isDirty || !weekMenu.lastSyncAt
        );
        observer.next(unsyncedWeekMenus);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Get week menus by year
   */
  getWeekMenusByYear(year: number): Observable<WeekMenu[]> {
    return new Observable(observer => {
      this.indexedDB.getAllWeekMenus().then(allWeekMenus => {
        const filteredWeekMenus = allWeekMenus.filter(weekMenu => 
          weekMenu.year === year
        );
        observer.next(filteredWeekMenus);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Get week menus by date range
   */
  getWeekMenusByDateRange(startDate: Date, endDate: Date): Observable<WeekMenu[]> {
    return new Observable(observer => {
      this.indexedDB.getAllWeekMenus().then(allWeekMenus => {
        const filteredWeekMenus = allWeekMenus.filter(weekMenu => {
          // Create a date for the start of the week (assuming Monday is day 1)
          const weekStartDate = new Date(weekMenu.year, 0, 1);
          const firstMonday = new Date(weekStartDate);
          firstMonday.setDate(weekStartDate.getDate() + (1 - weekStartDate.getDay()));
          const weekDate = new Date(firstMonday);
          weekDate.setDate(firstMonday.getDate() + (weekMenu.weekNumber - 1) * 7);
          
          return weekDate >= startDate && weekDate <= endDate;
        });
        observer.next(filteredWeekMenus);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Force refresh week menus from server
   */
  forceRefreshFromServer(): Observable<WeekMenu[]> {
    if (this.connectivity.isOffline) {
      return new Observable(observer => {
        observer.error(new Error('Cannot refresh from server while offline'));
        observer.complete();
      });
    }

    return new Observable(observer => {
      this.indexedDB.getAllWeekMenus().then(cachedWeekMenus => {
        // Clear week menus from cache
        const clearPromises = cachedWeekMenus.map(weekMenu => 
          weekMenu.id ? this.indexedDB.deleteWeekMenu(weekMenu.id) : Promise.resolve()
        );
        
        Promise.all(clearPromises).then(() => {
          this.getWeekMenus().subscribe({
            next: (weekMenus) => {
              observer.next(weekMenus);
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

  /**
   * Generate temporary ID for offline operations
   */
  private generateTempId(): string {
    return `temp_${this.entityType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

