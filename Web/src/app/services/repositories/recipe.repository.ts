import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseRepository } from './base-repository';
import { IndexedDBService } from '../offline/indexeddb.service';
import { ConnectivityService } from '../offline/connectivity.service';
import { SyncService } from '../offline/sync.service';
import { Recipe, CreateRecipeRequest, UpdateRecipeRequest } from '../../models/recipe.model';

/**
 * Recipe repository implementing offline-first data access
 * Extends BaseRepository with recipe-specific operations
 */
@Injectable({
  providedIn: 'root'
})
export class RecipeRepository extends BaseRepository<Recipe> {
  protected readonly entityType = 'recipe' as const;
  protected readonly apiBaseUrl = '/api/recipes';

  constructor(
    httpClient: HttpClient,
    indexedDB: IndexedDBService,
    connectivity: ConnectivityService,
    sync: SyncService
  ) {
    super(httpClient, indexedDB, connectivity, sync);
  }

  /**
   * Get all recipes using cache-first strategy
   */
  getAllRecipes(): Observable<Recipe[]> {
    return this.getAllFromCacheFirst();
  }

  /**
   * Get recipe by ID using cache-first strategy
   */
  getRecipeById(recipeId: string): Observable<Recipe | null> {
    return this.getByIdFromCacheFirst(recipeId);
  }

  /**
   * Get recipes by cookbook ID
   */
  getRecipesByCookbook(cookbookId: string): Observable<Recipe[]> {
    return new Observable(observer => {
      this.indexedDB.getRecipesByCookbook(cookbookId).then(recipes => {
        observer.next(recipes);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Get recipes by meal type
   */
  getRecipesByMealType(mealType: string): Observable<Recipe[]> {
    return new Observable(observer => {
      this.indexedDB.getRecipesByMealType(mealType).then(recipes => {
        observer.next(recipes);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Create new recipe with offline support
   */
  createNewRecipe(recipeRequest: CreateRecipeRequest): Observable<Recipe> {
    return this.createEntityWithOfflineSupport(recipeRequest);
  }

  /**
   * Update existing recipe with offline support
   */
  updateExistingRecipe(recipeId: string, recipeRequest: UpdateRecipeRequest): Observable<Recipe> {
    return this.updateEntityWithOfflineSupport(recipeId, recipeRequest);
  }

  /**
   * Delete recipe with offline support
   */
  deleteRecipeById(recipeId: string): Observable<void> {
    return this.deleteEntityWithOfflineSupport(recipeId);
  }

  /**
   * Search recipes by title (local search only for offline support)
   */
  searchRecipesByTitle(searchTerm: string): Observable<Recipe[]> {
    return new Observable(observer => {
      this.indexedDB.getAllRecipes().then(allRecipes => {
        const filteredRecipes = allRecipes.filter(recipe =>
          recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        observer.next(filteredRecipes);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Search recipes by tags (local search only for offline support)
   */
  searchRecipesByTags(tags: string[]): Observable<Recipe[]> {
    return new Observable(observer => {
      this.indexedDB.getAllRecipes().then(allRecipes => {
        const filteredRecipes = allRecipes.filter(recipe =>
          tags.some(tag => recipe.tags.includes(tag))
        );
        observer.next(filteredRecipes);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Search recipes by ingredients (local search only for offline support)
   */
  searchRecipesByIngredients(ingredientNames: string[]): Observable<Recipe[]> {
    return new Observable(observer => {
      this.indexedDB.getAllRecipes().then(allRecipes => {
        const filteredRecipes = allRecipes.filter(recipe =>
          ingredientNames.some(ingredientName =>
            recipe.ingredients.some(ingredient =>
              ingredient.name.toLowerCase().includes(ingredientName.toLowerCase())
            )
          )
        );
        observer.next(filteredRecipes);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Get recipes that haven't been synced yet
   */
  getUnsyncedRecipes(): Observable<Recipe[]> {
    return new Observable(observer => {
      this.indexedDB.getAllRecipes().then(allRecipes => {
        const unsyncedRecipes = allRecipes.filter(recipe => 
          recipe.isDirty || !recipe.lastSyncAt
        );
        observer.next(unsyncedRecipes);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Force refresh recipes from server
   */
  forceRefreshFromServer(): Observable<Recipe[]> {
    if (this.connectivity.isOffline) {
      return new Observable(observer => {
        observer.error(new Error('Cannot refresh from server while offline'));
        observer.complete();
      });
    }

    return new Observable(observer => {
      this.indexedDB.clearAllData().then(() => {
        this.getAllRecipes().subscribe({
          next: (recipes) => {
            observer.next(recipes);
            observer.complete();
          },
          error: (error) => {
            observer.error(error);
          }
        });
      }).catch(error => {
        observer.error(error);
      });
    });
  }
}

