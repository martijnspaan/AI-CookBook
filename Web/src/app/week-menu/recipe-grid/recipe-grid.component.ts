import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RecipeService } from '../../services/recipe.service';
import { CookbookService } from '../../services/cookbook.service';
import { MealTypeTranslationService } from '../../services/meal-type-translation.service';
import { Recipe } from '../../models/recipe.model';
import { Cookbook } from '../../models/cookbook.model';
import { RecipeFilterComponent, RecipeFilterOptions, RecipeFilterState } from '../../shared/recipe-filter/recipe-filter.component';
import { MultiSelectOption } from '../../shared/multi-select-dropdown/multi-select-dropdown.component';

@Component({
  selector: 'app-recipe-grid',
  standalone: true,
  imports: [CommonModule, TranslateModule, RecipeFilterComponent],
  templateUrl: './recipe-grid.component.html',
  styleUrl: './recipe-grid.component.scss'
})
export class RecipeGridComponent implements OnInit, OnDestroy {
  @Input() selectedMealType: 'breakfast' | 'lunch' | 'dinner' | null = null;
  @Input() recipes: Recipe[] = [];
  @Input() isLoadingRecipes = false;
  @Input() errorMessage: string | null = null;
  @Output() recipeSelected = new EventEmitter<{ recipe: Recipe; mealType: string }>();

  // Filter properties
  filterState: RecipeFilterState = {
    selectedMealTypeFilters: [],
    selectedCookbookFilters: [],
    searchQuery: ''
  };

  private recipesInternal: Recipe[] = [];
  private isLoadingRecipesInternal = false;
  private errorMessageInternal: string | null = null;
  private cookbooks: Cookbook[] = [];
  private isLoadingCookbooks = false;
  private readonly destroySubject = new Subject<void>();

  constructor(
    private readonly recipeService: RecipeService,
    private readonly cookbookService: CookbookService,
    private readonly translate: TranslateService,
    private readonly mealTypeTranslationService: MealTypeTranslationService
  ) {}

  ngOnInit(): void {
    // If no recipes are provided via input, load them
    if (this.recipes.length === 0) {
      this.loadAllRecipes();
    }
    // Load cookbooks for filtering
    this.loadAllCookbooks();
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  loadAllRecipes(): void {
    this.isLoadingRecipesInternal = true;
    this.errorMessageInternal = null;
    
    this.recipeService.getAllRecipes()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (recipes) => {
          this.recipesInternal = recipes;
          this.isLoadingRecipesInternal = false;
        },
        error: (error) => {
          this.errorMessageInternal = 'Failed to load recipes. Please make sure the API is running.';
          this.isLoadingRecipesInternal = false;
          console.error('Error loading recipes:', error);
        }
      });
  }

  loadAllCookbooks(): void {
    this.isLoadingCookbooks = true;
    
    this.cookbookService.getAllCookbooks()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (cookbooks) => {
          this.cookbooks = cookbooks;
          this.isLoadingCookbooks = false;
        },
        error: (error) => {
          this.isLoadingCookbooks = false;
          console.error('Error loading cookbooks:', error);
        }
      });
  }

  get recipesToShow(): Recipe[] {
    const allRecipes = this.recipes.length > 0 ? this.recipes : this.recipesInternal;
    return this.filterRecipes(allRecipes);
  }

  get filterOptions(): RecipeFilterOptions {
    const allRecipes = this.recipes.length > 0 ? this.recipes : this.recipesInternal;
    
    // Create meal type options
    const mealTypes = new Set<string>();
    allRecipes.forEach(recipe => {
      recipe.mealTypes.forEach(mealType => mealTypes.add(mealType));
    });
    
    const mealTypeOptions: MultiSelectOption[] = Array.from(mealTypes).sort().map(mealType => ({
      value: mealType,
      label: this.mealTypeTranslationService.getMealTypeTranslation(mealType)
    }));

    // Create cookbook options
    const cookbookOptions: MultiSelectOption[] = this.cookbooks.map(cookbook => ({
      value: cookbook.id,
      label: cookbook.title
    }));

    return {
      mealTypeOptions,
      cookbookOptions
    };
  }

  get isLoading(): boolean {
    return this.isLoadingRecipes || this.isLoadingRecipesInternal || this.isLoadingCookbooks;
  }

  get error(): string | null {
    return this.errorMessage || this.errorMessageInternal;
  }

  selectRecipe(recipe: Recipe): void {
    if (this.selectedMealType) {
      this.recipeSelected.emit({
        recipe: recipe,
        mealType: this.selectedMealType
      });
    }
  }

  onDragStart(event: DragEvent, recipe: Recipe): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify(recipe));
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onTouchStart(event: TouchEvent, recipe: Recipe): void {
    // Store the recipe data for touch drag
    const touch = event.touches[0];
    const element = event.target as HTMLElement;
    
    // Find the recipe card container (the draggable element)
    const recipeCard = element.closest('.recipe-card') as HTMLElement;
    if (!recipeCard) return;
    
    // Add visual feedback to the recipe card
    recipeCard.style.transform = 'scale(0.95)';
    recipeCard.style.opacity = '0.8';
    
    // Store the recipe data globally for touch drag
    (window as any).touchDragData = {
      recipe: recipe,
      startX: touch.clientX,
      startY: touch.clientY,
      element: recipeCard
    };
    
    // Prevent default to avoid scrolling
    event.preventDefault();
  }

  onTouchMove(event: TouchEvent): void {
    const touchData = (window as any).touchDragData;
    if (!touchData) return;
    
    const touch = event.touches[0];
    const deltaX = touch.clientX - touchData.startX;
    const deltaY = touch.clientY - touchData.startY;
    
    // Only start dragging if moved more than 10px
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      // Add dragging class for visual feedback
      touchData.element.classList.add('touch-dragging');
      touchData.element.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.95)`;
      touchData.element.style.zIndex = '9999';
      touchData.element.style.position = 'relative';
    }
    
    event.preventDefault();
  }

  onTouchEnd(event: TouchEvent): void {
    const touchData = (window as any).touchDragData;
    if (!touchData) return;
    
    const touch = event.changedTouches[0];
    const element = touchData.element;
    
    // Reset visual styles
    element.style.transform = '';
    element.style.opacity = '';
    element.style.zIndex = '';
    element.style.position = '';
    element.classList.remove('touch-dragging');
    
    // Find drop target
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    if (dropTarget) {
      // Check if it's a meal slot
      const mealSlot = dropTarget.closest('.meal-slot');
      if (mealSlot) {
        // Get meal type and date from the meal slot
        const dayCard = mealSlot.closest('.day-card');
        if (dayCard) {
          const dateElement = dayCard.querySelector('.day-number');
          const mealType = this.getMealTypeFromMealSlot(mealSlot);
          
          if (dateElement && mealType) {
            // Create a synthetic drop event
            this.emitTouchDrop(touchData.recipe, mealType, dateElement);
          }
        }
      }
    }
    
    // Clear touch data
    (window as any).touchDragData = null;
  }

  private getMealTypeFromMealSlot(mealSlot: Element): 'breakfast' | 'lunch' | 'dinner' | null {
    const mealLabel = mealSlot.querySelector('.meal-label');
    if (!mealLabel) return null;
    
    const labelText = mealLabel.textContent?.toLowerCase() || '';
    if (labelText.includes('breakfast')) return 'breakfast';
    if (labelText.includes('lunch')) return 'lunch';
    if (labelText.includes('dinner')) return 'dinner';
    return null;
  }

  private emitTouchDrop(recipe: Recipe, mealType: 'breakfast' | 'lunch' | 'dinner', dateElement: Element): void {
    // Get the date from the day card
    const dayCard = dateElement.closest('.day-card');
    if (!dayCard) return;
    
    // Try to extract date from the day card
    const dayNumberElement = dayCard.querySelector('.day-number');
    if (!dayNumberElement) return;
    
    const dayNumber = parseInt(dayNumberElement.textContent || '1');
    const today = new Date();
    
    // Calculate the target date based on the current week
    // This is a simplified approach - in a real implementation, you'd need to
    // get the actual date from the week calendar component
    const targetDate = new Date(today);
    
    // Find the date that matches the day number in the current week
    const currentWeekStart = this.getWeekStart(today);
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      if (date.getDate() === dayNumber) {
        targetDate.setTime(date.getTime());
        break;
      }
    }
    
    // Create a custom event to communicate with the week menu component
    const touchDropEvent = new CustomEvent('touchRecipeDropped', {
      detail: {
        recipe: recipe,
        mealType: mealType,
        date: targetDate
      }
    });
    
    // Dispatch the event to the document
    document.dispatchEvent(touchDropEvent);
  }

  private getWeekStart(date: Date): Date {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }

  getTagsAsCommaSeparatedString(tags: string[]): string {
    return tags.join(', ');
  }

  getMealTypeTranslation(mealType: string): string {
    return this.mealTypeTranslationService.getMealTypeTranslation(mealType);
  }

  getCookbookTitle(cookbookId: string): string {
    const cookbook = this.cookbooks.find(cb => cb.id === cookbookId);
    return cookbook ? cookbook.title : '';
  }

  private filterRecipes(recipes: Recipe[]): Recipe[] {
    return recipes.filter(recipe => {
      // Filter by search query
      if (this.filterState.searchQuery) {
        const searchTerm = this.filterState.searchQuery.toLowerCase();
        const matchesTitle = recipe.title.toLowerCase().includes(searchTerm);
        const matchesDescription = recipe.description?.toLowerCase().includes(searchTerm) || false;
        const matchesTags = recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        
        if (!matchesTitle && !matchesDescription && !matchesTags) {
          return false;
        }
      }

      // Filter by meal type
      if (this.filterState.selectedMealTypeFilters.length > 0) {
        if (!this.filterState.selectedMealTypeFilters.some(filter => recipe.mealTypes.includes(filter))) {
          return false;
        }
      }

      // Filter by cookbook
      if (this.filterState.selectedCookbookFilters.length > 0) {
        if (!recipe.cookbookId || !this.filterState.selectedCookbookFilters.includes(recipe.cookbookId)) {
          return false;
        }
      }

      return true;
    });
  }

  onFilterChanged(newFilterState: RecipeFilterState): void {
    this.filterState = newFilterState;
  }

  onFiltersCleared(): void {
    this.filterState = {
      selectedMealTypeFilters: [],
      selectedCookbookFilters: [],
      searchQuery: ''
    };
  }
}
