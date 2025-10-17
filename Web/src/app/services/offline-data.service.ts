import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RecipeRepository } from './repositories/recipe.repository';
import { CookbookRepository } from './repositories/cookbook.repository';
import { GroceryListRepository } from './repositories/grocery-list.repository';
import { WeekMenuRepository } from './repositories/week-menu.repository';
import { ConnectivityService } from './offline/connectivity.service';
import { SyncService } from './offline/sync.service';
import { PwaService } from './offline/pwa.service';
import { Recipe, CreateRecipeRequest, UpdateRecipeRequest } from '../models/recipe.model';
import { Cookbook, CreateCookbookRequest, UpdateCookbookRequest } from '../models/cookbook.model';
import { GroceryList, CreateGroceryListRequest, UpdateIngredientStateRequest } from '../models/grocery-list.model';
import { WeekMenu, CreateOrUpdateWeekMenuRequest, CreateOrUpdateWeekMenuResponse } from '../models/week-menu.model';

/**
 * Centralized offline data service that provides a unified interface
 * for accessing all offline-first repositories
 */
@Injectable({
  providedIn: 'root'
})
export class OfflineDataService {
  constructor(
    private readonly recipeRepository: RecipeRepository,
    private readonly cookbookRepository: CookbookRepository,
    private readonly groceryListRepository: GroceryListRepository,
    private readonly weekMenuRepository: WeekMenuRepository,
    private readonly connectivity: ConnectivityService,
    private readonly sync: SyncService,
    private readonly pwa: PwaService
  ) {}

  // ========== CONNECTIVITY ==========

  get isOnline$(): Observable<boolean> {
    return this.connectivity.isOnline$;
  }

  get isOffline$(): Observable<boolean> {
    return this.connectivity.isOffline$;
  }

  get isOnline(): boolean {
    return this.connectivity.isOnline;
  }

  get isOffline(): boolean {
    return this.connectivity.isOffline;
  }

  // ========== SYNC STATUS ==========

  get syncStatus$(): Observable<'idle' | 'syncing' | 'error'> {
    return this.sync.syncStatus$;
  }

  get lastSyncTime$(): Observable<Date | null> {
    return this.sync.lastSyncTime$;
  }

  get syncError$(): Observable<string | null> {
    return this.sync.syncError$;
  }

  // ========== PWA STATUS ==========

  get canInstall(): boolean {
    return this.pwa.canInstall;
  }

  get isRunningAsPwa(): boolean {
    return this.pwa.isRunningAsPwa();
  }

  // ========== RECIPE OPERATIONS ==========

  getAllRecipes(): Observable<Recipe[]> {
    return this.recipeRepository.getAllRecipes();
  }

  getRecipeById(id: string): Observable<Recipe | null> {
    return this.recipeRepository.getRecipeById(id);
  }

  getRecipesByCookbook(cookbookId: string): Observable<Recipe[]> {
    return this.recipeRepository.getRecipesByCookbook(cookbookId);
  }

  getRecipesByMealType(mealType: string): Observable<Recipe[]> {
    return this.recipeRepository.getRecipesByMealType(mealType);
  }

  createRecipe(request: CreateRecipeRequest): Observable<Recipe> {
    return this.recipeRepository.createNewRecipe(request);
  }

  updateRecipe(id: string, request: UpdateRecipeRequest): Observable<Recipe> {
    return this.recipeRepository.updateExistingRecipe(id, request);
  }

  deleteRecipe(id: string): Observable<void> {
    return this.recipeRepository.deleteRecipeById(id);
  }

  searchRecipesByTitle(searchTerm: string): Observable<Recipe[]> {
    return this.recipeRepository.searchRecipesByTitle(searchTerm);
  }

  searchRecipesByTags(tags: string[]): Observable<Recipe[]> {
    return this.recipeRepository.searchRecipesByTags(tags);
  }

  searchRecipesByIngredients(ingredientNames: string[]): Observable<Recipe[]> {
    return this.recipeRepository.searchRecipesByIngredients(ingredientNames);
  }

  // ========== COOKBOOK OPERATIONS ==========

  getAllCookbooks(): Observable<Cookbook[]> {
    return this.cookbookRepository.getAllCookbooks();
  }

  getCookbookById(id: string): Observable<Cookbook | null> {
    return this.cookbookRepository.getCookbookById(id);
  }

  createCookbook(request: CreateCookbookRequest): Observable<Cookbook> {
    return this.cookbookRepository.createNewCookbook(request);
  }

  updateCookbook(id: string, request: UpdateCookbookRequest): Observable<Cookbook> {
    return this.cookbookRepository.updateExistingCookbook(id, request);
  }

  deleteCookbook(id: string): Observable<void> {
    return this.cookbookRepository.deleteCookbookById(id);
  }

  searchCookbooksByTitle(searchTerm: string): Observable<Cookbook[]> {
    return this.cookbookRepository.searchCookbooksByTitle(searchTerm);
  }

  searchCookbooksByAuthor(authorName: string): Observable<Cookbook[]> {
    return this.cookbookRepository.searchCookbooksByAuthor(authorName);
  }

  // ========== GROCERY LIST OPERATIONS ==========

  getAllGroceryLists(): Observable<GroceryList[]> {
    return this.groceryListRepository.getAllGroceryLists();
  }

  getGroceryListById(id: string): Observable<GroceryList | null> {
    return this.groceryListRepository.getGroceryListById(id);
  }

  getGroceryListByDate(date: string): Observable<GroceryList | null> {
    return this.groceryListRepository.getGroceryListByDate(date);
  }

  createGroceryList(request: CreateGroceryListRequest): Observable<GroceryList> {
    return this.groceryListRepository.createGroceryList(request);
  }

  updateGroceryList(id: string, request: CreateGroceryListRequest): Observable<GroceryList> {
    return this.groceryListRepository.updateGroceryList(id, request);
  }

  deleteGroceryList(id: string): Observable<void> {
    return this.groceryListRepository.deleteGroceryList(id);
  }

  updateIngredientState(id: string, request: UpdateIngredientStateRequest): Observable<GroceryList> {
    return this.groceryListRepository.updateIngredientState(id, request);
  }

  getGroceryListsByDateRange(startDate: string, endDate: string): Observable<GroceryList[]> {
    return this.groceryListRepository.getGroceryListsByDateRange(startDate, endDate);
  }

  // ========== WEEK MENU OPERATIONS ==========

  getAllWeekMenus(): Observable<WeekMenu[]> {
    return this.weekMenuRepository.getWeekMenus();
  }

  getWeekMenuById(id: string): Observable<WeekMenu | null> {
    return this.weekMenuRepository.getWeekMenuById(id);
  }

  getWeekMenuByWeekAndYear(weekNumber: number, year: number): Observable<WeekMenu | null> {
    return this.weekMenuRepository.getWeekMenuByWeekAndYear(weekNumber, year);
  }

  createOrUpdateWeekMenu(request: CreateOrUpdateWeekMenuRequest): Observable<CreateOrUpdateWeekMenuResponse> {
    return this.weekMenuRepository.createOrUpdateWeekMenu(request);
  }

  getWeekMenusByYear(year: number): Observable<WeekMenu[]> {
    return this.weekMenuRepository.getWeekMenusByYear(year);
  }

  getWeekMenusByDateRange(startDate: Date, endDate: Date): Observable<WeekMenu[]> {
    return this.weekMenuRepository.getWeekMenusByDateRange(startDate, endDate);
  }

  // ========== SYNC OPERATIONS ==========

  async forceSync(): Promise<void> {
    return await this.sync.forceSync();
  }

  clearSyncError(): void {
    this.sync.clearSyncError();
  }

  // ========== PWA OPERATIONS ==========

  async installApp(): Promise<boolean> {
    return await this.pwa.promptInstall();
  }

  async checkForUpdates(): Promise<boolean> {
    return await this.pwa.checkForUpdates();
  }

  async forceUpdate(): Promise<void> {
    return await this.pwa.forceUpdate();
  }

  // ========== UTILITY METHODS ==========

  getConnectionStatusDescription(): string {
    return this.connectivity.getConnectionStatusDescription();
  }

  getDeviceCapabilities() {
    return this.pwa.getDeviceCapabilities();
  }

  isOfflineFullySupported(): boolean {
    return this.pwa.isOfflineFullySupported();
  }

  // ========== REFRESH OPERATIONS ==========

  forceRefreshRecipes(): Observable<Recipe[]> {
    return this.recipeRepository.forceRefreshFromServer();
  }

  forceRefreshCookbooks(): Observable<Cookbook[]> {
    return this.cookbookRepository.forceRefreshFromServer();
  }

  forceRefreshGroceryLists(): Observable<GroceryList[]> {
    return this.groceryListRepository.forceRefreshFromServer();
  }

  forceRefreshWeekMenus(): Observable<WeekMenu[]> {
    return this.weekMenuRepository.forceRefreshFromServer();
  }

  // ========== UNSYNCED DATA ==========

  getUnsyncedRecipes(): Observable<Recipe[]> {
    return this.recipeRepository.getUnsyncedRecipes();
  }

  getUnsyncedCookbooks(): Observable<Cookbook[]> {
    return this.cookbookRepository.getUnsyncedCookbooks();
  }

  getUnsyncedGroceryLists(): Observable<GroceryList[]> {
    return this.groceryListRepository.getUnsyncedGroceryLists();
  }

  getUnsyncedWeekMenus(): Observable<WeekMenu[]> {
    return this.weekMenuRepository.getUnsyncedWeekMenus();
  }
}

