import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RecipeService } from '../../services/recipe.service';
import { CookbookService } from '../../services/cookbook.service';
import { RecipeSettingsService } from '../../services/recipe-settings.service';
import { Recipe } from '../../models/recipe.model';
import { Cookbook } from '../../models/cookbook.model';
import { RecipeSettings } from '../../models/recipe-settings.model';
import { RecipeCardComponent } from '../../shared/recipe-card/recipe-card.component';
import { MultiSelectDropdownComponent, MultiSelectOption } from '../../shared/multi-select-dropdown/multi-select-dropdown.component';

@Component({
  selector: 'app-recipe-selection-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, RecipeCardComponent, MultiSelectDropdownComponent],
  templateUrl: './recipe-selection-dialog.component.html',
  styleUrl: './recipe-selection-dialog.component.scss',
  host: {
    '[class.dialog-visible]': 'isVisible'
  }
})
export class RecipeSelectionDialogComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isVisible: boolean = false;
  @Input() selectedMealType: 'breakfast' | 'lunch' | 'dinner' | null = null;
  @Input() selectedDate: Date | null = null;
  @Input() currentRecipe: Recipe | null = null;
  @Output() recipeSelected = new EventEmitter<{ recipe: Recipe; mealType: string }>();
  @Output() recipeRemoved = new EventEmitter<{ mealType: string; date: Date }>();
  @Output() dialogClosed = new EventEmitter<void>();

  recipes: Recipe[] = [];
  allRecipes: Recipe[] = [];
  filteredRecipes: Recipe[] = [];
  cookbooks: Cookbook[] = [];
  recipeSettings: RecipeSettings | null = null;
  isLoadingRecipes = false;
  isLoadingCookbooks = false;
  isLoadingRecipeSettings = false;
  errorMessage: string | null = null;
  
  selectedMealTypeFilters: string[] = [];
  selectedCookbookFilters: string[] = [];
  mealTypeOptions: MultiSelectOption[] = [];
  cookbookOptions: MultiSelectOption[] = [];
  
  // Search functionality
  searchQuery: string = '';
  searchSuggestions: string[] = [];
  showSearchSuggestions: boolean = false;
  allSearchableTerms: string[] = [];
  
  private readonly destroySubject = new Subject<void>();

  constructor(
    private readonly recipeService: RecipeService,
    private readonly cookbookService: CookbookService,
    private readonly recipeSettingsService: RecipeSettingsService
  ) {}

  ngOnInit(): void {
    if (this.isVisible) {
      this.loadAllRecipes();
      this.loadCookbooks();
      this.loadRecipeSettings();
    }
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && this.isVisible) {
      this.loadAllRecipes();
      this.loadCookbooks();
      this.loadRecipeSettings();
      this.preselectMealTypeFilter();
      this.clearSearch();
    }
  }

  loadAllRecipes(): void {
    this.isLoadingRecipes = true;
    this.errorMessage = null;
    
    this.recipeService.getAllRecipes()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (recipes) => {
          this.allRecipes = recipes;
          this.extractAvailableMealTypes(recipes);
          this.applyFilters();
          this.isLoadingRecipes = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load recipes. Please make sure the API is running.';
          this.isLoadingRecipes = false;
          console.error('Error loading recipes:', error);
        }
      });
  }

  loadCookbooks(): void {
    this.isLoadingCookbooks = true;
    
    this.cookbookService.getAllCookbooks()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (cookbooks) => {
          this.cookbooks = cookbooks;
          this.cookbookOptions = cookbooks.map(cookbook => ({
            value: cookbook.id,
            label: cookbook.title
          }));
          this.isLoadingCookbooks = false;
        },
        error: (error) => {
          console.error('Error loading cookbooks:', error);
          this.isLoadingCookbooks = false;
        }
      });
  }

  loadRecipeSettings(): void {
    this.isLoadingRecipeSettings = true;
    
    this.recipeSettingsService.getRecipeSettings()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (settings) => {
          this.recipeSettings = settings;
          // Meal types are always fixed: Breakfast, Lunch, Dinner
          this.mealTypeOptions = [
            { value: 'Breakfast', label: 'Breakfast' },
            { value: 'Lunch', label: 'Lunch' },
            { value: 'Dinner', label: 'Dinner' }
          ];
          this.isLoadingRecipeSettings = false;
        },
        error: (error) => {
          console.error('Error loading recipe settings:', error);
          this.isLoadingRecipeSettings = false;
        }
      });
  }

  extractAvailableMealTypes(recipes: Recipe[]): void {
    // Meal types are always fixed: Breakfast, Lunch, Dinner
    // This method is kept for compatibility but doesn't change the fixed meal types
    this.mealTypeOptions = [
      { value: 'Breakfast', label: 'Breakfast' },
      { value: 'Lunch', label: 'Lunch' },
      { value: 'Dinner', label: 'Dinner' }
    ];
  }

  preselectMealTypeFilter(): void {
    if (this.selectedMealType) {
      // Convert lowercase meal type to proper case to match recipe data
      const properCaseMealType = this.selectedMealType.charAt(0).toUpperCase() + this.selectedMealType.slice(1);
      // Pre-select the meal type filter based on the selected meal slot
      this.selectedMealTypeFilters = [properCaseMealType];
    } else {
      // Clear the filter if no specific meal type is selected
      this.selectedMealTypeFilters = [];
    }
    // Apply the pre-selected filter
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.allRecipes];

    if (this.selectedMealTypeFilters.length > 0) {
      filtered = filtered.filter(recipe => 
        this.selectedMealTypeFilters.some(filter => 
          recipe.mealTypes.includes(filter)
        )
      );
    }

    if (this.selectedCookbookFilters.length > 0) {
      filtered = filtered.filter(recipe => 
        recipe.cookbookId && this.selectedCookbookFilters.includes(recipe.cookbookId)
      );
    }

    // Apply search filter
    if (this.searchQuery.trim().length > 0) {
      filtered = this.filterBySearchQuery(filtered);
    }

    this.filteredRecipes = filtered;
    this.recipes = this.filteredRecipes;
  }

  filterBySearchQuery(recipes: Recipe[]): Recipe[] {
    const query = this.searchQuery.toLowerCase().trim();
    
    return recipes.filter(recipe => {
      // Search in title
      if (recipe.title.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search in tags
      if (recipe.tags.some(tag => tag.toLowerCase().includes(query))) {
        return true;
      }
      
      // Search in ingredients
      if (recipe.ingredients.some(ingredient => 
        ingredient.name.toLowerCase().includes(query) ||
        ingredient.type.toLowerCase().includes(query)
      )) {
        return true;
      }
      
      return false;
    });
  }


  clearFilters(): void {
    this.selectedMealTypeFilters = [];
    this.selectedCookbookFilters = [];
    this.searchQuery = '';
    this.searchSuggestions = [];
    this.showSearchSuggestions = false;
    this.applyFilters();
  }

  onMealTypeSelectionChanged(selectedValues: string[]): void {
    this.selectedMealTypeFilters = selectedValues;
    this.applyFilters();
  }

  onCookbookSelectionChanged(selectedValues: string[]): void {
    this.selectedCookbookFilters = selectedValues;
    this.applyFilters();
  }

  // Search functionality methods
  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.generateSearchSuggestions();
    this.applyFilters();
  }

  onSearchFocus(): void {
    if (this.searchQuery.length > 0) {
      this.generateSearchSuggestions();
      this.showSearchSuggestions = true;
    }
  }

  onSearchBlur(): void {
    // Delay hiding suggestions to allow for clicks on suggestions
    setTimeout(() => {
      this.showSearchSuggestions = false;
    }, 200);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchSuggestions = [];
    this.showSearchSuggestions = false;
    this.applyFilters();
  }

  selectSearchSuggestion(suggestion: string): void {
    this.searchQuery = suggestion;
    this.showSearchSuggestions = false;
    this.applyFilters();
  }

  generateSearchSuggestions(): void {
    if (this.searchQuery.length < 2) {
      this.searchSuggestions = [];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    const suggestions = new Set<string>();

    // Add matching titles
    this.allRecipes.forEach(recipe => {
      if (recipe.title.toLowerCase().includes(query)) {
        suggestions.add(recipe.title);
      }
    });

    // Add matching tags
    this.allRecipes.forEach(recipe => {
      recipe.tags.forEach(tag => {
        if (tag.toLowerCase().includes(query)) {
          suggestions.add(tag);
        }
      });
    });

    // Add matching ingredient names and types
    this.allRecipes.forEach(recipe => {
      recipe.ingredients.forEach(ingredient => {
        if (ingredient.name.toLowerCase().includes(query)) {
          suggestions.add(ingredient.name);
        }
        if (ingredient.type.toLowerCase().includes(query)) {
          suggestions.add(ingredient.type);
        }
      });
    });

    this.searchSuggestions = Array.from(suggestions).slice(0, 8); // Limit to 8 suggestions
  }



  selectRecipe(recipe: Recipe): void {
    if (this.selectedMealType) {
      this.recipeSelected.emit({
        recipe: recipe,
        mealType: this.selectedMealType
      });
      this.closeDialog();
    }
  }

  removeRecipe(): void {
    if (this.selectedMealType && this.selectedDate) {
      this.recipeRemoved.emit({
        mealType: this.selectedMealType,
        date: this.selectedDate
      });
      this.closeDialog();
    }
  }

  closeDialog(): void {
    this.clearSearch();
    this.dialogClosed.emit();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeDialog();
    }
  }


  getDateDisplayString(): string {
    if (!this.selectedDate) return '';
    return this.selectedDate.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}
