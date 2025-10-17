import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

/**
 * IndexedDB schema definition for the Meal Week Planner application
 */
interface MealWeekPlannerDB extends DBSchema {
  recipes: {
    key: string;
    value: RecipeData;
    indexes: {
      'by-cookbook': string;
      'by-meal-type': string[];
      'by-title': string;
    };
  };
  cookbooks: {
    key: string;
    value: CookbookData;
    indexes: {
      'by-title': string;
    };
  };
  groceryLists: {
    key: string;
    value: GroceryListData;
    indexes: {
      'by-date': string;
    };
  };
  weekMenus: {
    key: string;
    value: WeekMenuData;
    indexes: {
      'by-week-year': string;
    };
  };
  syncQueue: {
    key: string;
    value: SyncOperation;
    indexes: {
      'by-type': string;
      'by-status': string;
      'by-timestamp': number;
    };
  };
  metadata: {
    key: string;
    value: MetadataValue;
  };
}

/**
 * Extended data interfaces with offline-specific fields
 */
interface RecipeData {
  id: string;
  title: string;
  description: string;
  tags: string[];
  ingredients: any[];
  recipe: string[];
  cookbookId?: string;
  page?: number;
  mealTypes: string[];
  servingSize: number;
  createdAt?: Date;
  updatedAt?: Date;
  lastSyncAt?: Date;
  isDirty?: boolean; // Flag for unsynchronized changes
}

interface CookbookData {
  id: string;
  title: string;
  author: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastSyncAt?: Date;
  isDirty?: boolean;
}

interface GroceryListData {
  id: string;
  dayOfGrocery: string;
  meals: any[];
  ingredientsState: any[];
  createdAt: string;
  updatedAt: string;
  lastSyncAt?: Date;
  isDirty?: boolean;
}

interface WeekMenuData {
  id?: string;
  weekNumber: number;
  year: number;
  weekDays: any[];
  lastSyncAt?: Date;
  isDirty?: boolean;
}

export interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: 'recipe' | 'cookbook' | 'groceryList' | 'weekMenu';
  entityId: string;
  data?: any;
  timestamp: number;
  status: 'PENDING' | 'SYNCING' | 'COMPLETED' | 'FAILED';
  retryCount: number;
  errorMessage?: string;
}

interface MetadataValue {
  key: string;
  value: any;
  updatedAt: Date;
}

/**
 * Core IndexedDB service for offline data persistence
 * Provides promise-based operations for all data types
 */
@Injectable({
  providedIn: 'root'
})
export class IndexedDBService {
  private readonly DB_NAME = 'meal-week-planner-db';
  private readonly DB_VERSION = 1;
  private dbPromise: Promise<IDBPDatabase<MealWeekPlannerDB>>;

  constructor() {
    this.dbPromise = this.initializeDatabase();
  }

  /**
   * Initialize the IndexedDB database with all object stores and indexes
   */
  private async initializeDatabase(): Promise<IDBPDatabase<MealWeekPlannerDB>> {
    return await openDB<MealWeekPlannerDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Recipes store
        if (!db.objectStoreNames.contains('recipes')) {
          const recipeStore = db.createObjectStore('recipes', { keyPath: 'id' });
          recipeStore.createIndex('by-cookbook', 'cookbookId');
          recipeStore.createIndex('by-meal-type', 'mealTypes');
          recipeStore.createIndex('by-title', 'title');
        }

        // Cookbooks store
        if (!db.objectStoreNames.contains('cookbooks')) {
          const cookbookStore = db.createObjectStore('cookbooks', { keyPath: 'id' });
          cookbookStore.createIndex('by-title', 'title');
        }

        // Grocery Lists store
        if (!db.objectStoreNames.contains('groceryLists')) {
          const groceryStore = db.createObjectStore('groceryLists', { keyPath: 'id' });
          groceryStore.createIndex('by-date', 'dayOfGrocery');
        }

        // Week Menus store
        if (!db.objectStoreNames.contains('weekMenus')) {
          const weekMenuStore = db.createObjectStore('weekMenus', { keyPath: 'id' });
          weekMenuStore.createIndex('by-week-year', ['weekNumber', 'year']);
        }

        // Sync Queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('by-type', 'entityType');
          syncStore.createIndex('by-status', 'status');
          syncStore.createIndex('by-timestamp', 'timestamp');
        }

        // Metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      }
    });
  }

  /**
   * Get the database instance
   */
  private async getDb(): Promise<IDBPDatabase<MealWeekPlannerDB>> {
    return await this.dbPromise;
  }

  // ========== RECIPES OPERATIONS ==========

  async getAllRecipes(): Promise<RecipeData[]> {
    const db = await this.getDb();
    return await db.getAll('recipes');
  }

  async getRecipeById(id: string): Promise<RecipeData | undefined> {
    const db = await this.getDb();
    return await db.get('recipes', id);
  }

  async getRecipesByCookbook(cookbookId: string): Promise<RecipeData[]> {
    const db = await this.getDb();
    return await db.getAllFromIndex('recipes', 'by-cookbook', cookbookId);
  }

  async getRecipesByMealType(mealType: string): Promise<RecipeData[]> {
    const db = await this.getDb();
    const allRecipes = await db.getAll('recipes');
    return allRecipes.filter(recipe => recipe.mealTypes.includes(mealType));
  }

  async saveRecipe(recipe: RecipeData): Promise<void> {
    const db = await this.getDb();
    recipe.lastSyncAt = new Date();
    await db.put('recipes', recipe);
  }

  async deleteRecipe(id: string): Promise<void> {
    const db = await this.getDb();
    await db.delete('recipes', id);
  }

  // Generic method for getting entities by ID
  async getEntityById<T>(entityType: 'recipe' | 'cookbook' | 'groceryList' | 'weekMenu', id: string): Promise<T | undefined> {
    const db = await this.getDb();
    const storeName = entityType + 's' as 'recipes' | 'cookbooks' | 'groceryLists' | 'weekMenus';
    return await db.get(storeName, id) as T | undefined;
  }

  // ========== COOKBOOKS OPERATIONS ==========

  async getAllCookbooks(): Promise<CookbookData[]> {
    const db = await this.getDb();
    return await db.getAll('cookbooks');
  }

  async getCookbookById(id: string): Promise<CookbookData | undefined> {
    const db = await this.getDb();
    return await db.get('cookbooks', id);
  }

  async saveCookbook(cookbook: CookbookData): Promise<void> {
    const db = await this.getDb();
    cookbook.lastSyncAt = new Date();
    await db.put('cookbooks', cookbook);
  }

  async deleteCookbook(id: string): Promise<void> {
    const db = await this.getDb();
    await db.delete('cookbooks', id);
  }

  // ========== GROCERY LISTS OPERATIONS ==========

  async getAllGroceryLists(): Promise<GroceryListData[]> {
    const db = await this.getDb();
    return await db.getAll('groceryLists');
  }

  async getGroceryListById(id: string): Promise<GroceryListData | undefined> {
    const db = await this.getDb();
    return await db.get('groceryLists', id);
  }

  async getGroceryListByDate(date: string): Promise<GroceryListData | undefined> {
    const db = await this.getDb();
    const lists = await db.getAllFromIndex('groceryLists', 'by-date', date);
    return lists.length > 0 ? lists[0] : undefined;
  }

  async saveGroceryList(groceryList: GroceryListData): Promise<void> {
    const db = await this.getDb();
    groceryList.lastSyncAt = new Date();
    await db.put('groceryLists', groceryList);
  }

  async deleteGroceryList(id: string): Promise<void> {
    const db = await this.getDb();
    await db.delete('groceryLists', id);
  }

  // ========== WEEK MENUS OPERATIONS ==========

  async getAllWeekMenus(): Promise<WeekMenuData[]> {
    const db = await this.getDb();
    return await db.getAll('weekMenus');
  }

  async getWeekMenuById(id: string): Promise<WeekMenuData | undefined> {
    const db = await this.getDb();
    return await db.get('weekMenus', id);
  }

  async getWeekMenuByWeekAndYear(weekNumber: number, year: number): Promise<WeekMenuData | undefined> {
    const db = await this.getDb();
    // Create a compound key for the week and year
    const compoundKey = `${weekNumber}-${year}`;
    const allMenus = await db.getAll('weekMenus');
    const menu = allMenus.find(m => m.weekNumber === weekNumber && m.year === year);
    return menu;
  }

  async saveWeekMenu(weekMenu: WeekMenuData): Promise<void> {
    const db = await this.getDb();
    weekMenu.lastSyncAt = new Date();
    await db.put('weekMenus', weekMenu);
  }

  async deleteWeekMenu(id: string): Promise<void> {
    const db = await this.getDb();
    await db.delete('weekMenus', id);
  }

  // ========== SYNC QUEUE OPERATIONS ==========

  async addToSyncQueue(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<void> {
    const db = await this.getDb();
    const syncOp: SyncOperation = {
      ...operation,
      id: `${operation.entityType}_${operation.entityId}_${Date.now()}`,
      timestamp: Date.now(),
      status: 'PENDING',
      retryCount: 0
    };
    await db.put('syncQueue', syncOp);
  }

  async getPendingSyncOperations(): Promise<SyncOperation[]> {
    const db = await this.getDb();
    return await db.getAllFromIndex('syncQueue', 'by-status', 'PENDING');
  }

  async updateSyncOperationStatus(id: string, status: SyncOperation['status'], errorMessage?: string): Promise<void> {
    const db = await this.getDb();
    const operation = await db.get('syncQueue', id);
    if (operation) {
      operation.status = status;
      if (errorMessage) {
        operation.errorMessage = errorMessage;
        operation.retryCount++;
      }
      await db.put('syncQueue', operation);
    }
  }

  async removeSyncOperation(id: string): Promise<void> {
    const db = await this.getDb();
    await db.delete('syncQueue', id);
  }

  // ========== METADATA OPERATIONS ==========

  async setMetadata(key: string, value: any): Promise<void> {
    const db = await this.getDb();
    await db.put('metadata', { key, value, updatedAt: new Date() });
  }

  async getMetadata(key: string): Promise<any> {
    const db = await this.getDb();
    const metadata = await db.get('metadata', key);
    return metadata?.value;
  }

  async getLastSyncTime(entityType: string): Promise<Date | null> {
    const lastSync = await this.getMetadata(`lastSync_${entityType}`);
    return lastSync ? new Date(lastSync) : null;
  }

  async setLastSyncTime(entityType: string): Promise<void> {
    await this.setMetadata(`lastSync_${entityType}`, new Date().toISOString());
  }

  // ========== UTILITY OPERATIONS ==========

  async clearAllData(): Promise<void> {
    const db = await this.getDb();
    await db.clear('recipes');
    await db.clear('cookbooks');
    await db.clear('groceryLists');
    await db.clear('weekMenus');
    await db.clear('syncQueue');
    await db.clear('metadata');
  }

  async getDatabaseSize(): Promise<number> {
    const db = await this.getDb();
    const stores = ['recipes', 'cookbooks', 'groceryLists', 'weekMenus', 'syncQueue', 'metadata'] as const;
    let totalSize = 0;
    
    for (const storeName of stores) {
      const count = await db.count(storeName);
      totalSize += count;
    }
    
    return totalSize;
  }
}
