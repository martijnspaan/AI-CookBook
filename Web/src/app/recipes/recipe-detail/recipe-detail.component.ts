import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RecipeService } from '../../services/recipe.service';
import { CookbookService } from '../../services/cookbook.service';
import { RecipeSettingsService } from '../../services/recipe-settings.service';
import { Recipe, UpdateRecipeRequest } from '../../models/recipe.model';
import { Cookbook } from '../../models/cookbook.model';
import { RecipeSettings } from '../../models/recipe-settings.model';
import { PageTitleService } from '../../services/page-title.service';
import { FooterService } from '../../services/footer.service';
import { IngredientAutocompleteComponent } from '../../shared/ingredient-autocomplete/ingredient-autocomplete.component';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, IngredientAutocompleteComponent],
  templateUrl: './recipe-detail.component.html',
  styleUrl: './recipe-detail.component.scss'
})
export class RecipeDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  recipe: Recipe | null = null;
  cookbooks: Cookbook[] = [];
  recipeSettings: RecipeSettings | null = null;
  isLoadingRecipe = false;
  isLoadingCookbooks = false;
  isLoadingRecipeSettings = false;
  isUpdatingRecipe = false;
  errorMessage: string | null = null;
  isEditingMode = false;
  editedRecipe: Recipe | null = null;
  availableMealTypes: string[] = [];
  mealTypeKeys: string[] = ['breakfast', 'lunch', 'dinner'];
  availableIngredientTypes: string[] = [];
  availableUnits: string[] = [];
  private readonly destroySubject = new Subject<void>();


  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly recipeService: RecipeService,
    private readonly cookbookService: CookbookService,
    private readonly recipeSettingsService: RecipeSettingsService,
    private readonly pageTitleService: PageTitleService,
    private readonly footerService: FooterService,
    private readonly translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.loadAllCookbooks();
    this.loadRecipeSettings();
    
    const recipeId = this.activatedRoute.snapshot.paramMap.get('id');
    if (recipeId) {
      this.loadRecipeById(recipeId);
    } else {
      this.errorMessage = 'No recipe ID provided';
    }
  }

  ngAfterViewInit(): void {
    // Page title will be set after recipe is loaded in loadRecipeById method
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
    this.footerService.resetFooterConfig();
  }

  private setupFooterButtons(): void {
    this.footerService.setFooterConfigFromTranslation({
      showLeftButton: true,
      leftButtonTranslationKey: 'BUTTONS.BACK_TO_RECIPES',
      leftButtonIcon: 'fas fa-arrow-left',
      leftButtonClass: 'btn-outline-secondary',
      leftButtonClickHandler: () => this.navigateBackToRecipesList(),
      showRightButton: true,
      rightButtonTranslationKey: 'BUTTONS.EDIT_RECIPE',
      rightButtonIcon: 'fas fa-edit',
      rightButtonClass: 'btn-primary',
      rightButtonClickHandler: () => this.onRightButtonClick()
    });
  }

  private loadRecipeById(recipeId: string): void {
    this.isLoadingRecipe = true;
    this.errorMessage = null;
    
    this.recipeService.getRecipeById(recipeId)
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (recipe) => {
          this.recipe = recipe;
          this.editedRecipe = { ...recipe };
          // Use setTimeout to defer page title and footer setup to next change detection cycle
          setTimeout(() => {
            this.pageTitleService.setPageTitle(recipe.title);
            this.setupFooterButtons();
          }, 0);
          this.isLoadingRecipe = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load recipe details';
          this.isLoadingRecipe = false;
          console.error('Error loading recipe:', error);
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

  loadRecipeSettings(): void {
    this.isLoadingRecipeSettings = true;
    
    this.recipeSettingsService.getRecipeSettings()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (settings) => {
          this.recipeSettings = settings;
          if (settings) {
            // Meal types are always fixed: Breakfast, Lunch, Dinner
            this.loadTranslatedMealTypes();
            this.availableIngredientTypes = settings.categories || ['groente', 'fruit', 'olie', 'zuivel', 'kruid', 'anders'];
            this.availableUnits = settings.units || ['mg', 'g', 'kg', 'ml', 'dl', 'l', 'tbsp', 'tsp', 'cup', 'piece', 'pinch'];
          } else {
            // Fallback to default values if no settings found
            this.loadTranslatedMealTypes();
            this.availableIngredientTypes = ['groente', 'fruit', 'olie', 'zuivel', 'kruid', 'anders'];
            this.availableUnits = ['mg', 'g', 'kg', 'ml', 'dl', 'l', 'tbsp', 'tsp', 'cup', 'piece', 'pinch'];
          }
          this.isLoadingRecipeSettings = false;
        },
        error: (error) => {
          console.error('Error loading recipe settings:', error);
          // Fallback to default values on error
          this.loadTranslatedMealTypes();
          this.availableIngredientTypes = ['groente', 'fruit', 'olie', 'zuivel', 'kruid', 'anders'];
          this.availableUnits = ['mg', 'g', 'kg', 'ml', 'dl', 'l', 'tbsp', 'tsp', 'cup', 'piece', 'pinch'];
          this.isLoadingRecipeSettings = false;
        }
      });
  }

  private loadTranslatedMealTypes(): void {
    this.availableMealTypes = this.mealTypeKeys.map(key => 
      this.translate.instant(`MEAL_TYPES.${key.toUpperCase()}`)
    );
  }

  getMealTypeTranslation(mealType: string): string {
    // Convert meal type to lowercase for key lookup
    const key = mealType.toLowerCase();
    return this.translate.instant(`MEAL_TYPES.${key.toUpperCase()}`);
  }

  enableEditingMode(): void {
    this.isEditingMode = true;
    this.updateFooterButtons();
  }

  cancelEditingMode(): void {
    this.isEditingMode = false;
    if (this.recipe) {
      this.editedRecipe = { ...this.recipe };
    }
    this.updateFooterButtons();
  }

  private updateFooterButtons(): void {
    if (this.isEditingMode) {
      this.footerService.setFooterConfig({
        showLeftButton: true,
        leftButtonText: 'Cancel',
        leftButtonIcon: 'fas fa-times',
        leftButtonClass: 'btn-outline-secondary',
        leftButtonClickHandler: () => this.cancelEditingMode(),
        showRightButton: true,
        rightButtonText: 'Save Changes',
        rightButtonIcon: 'fas fa-save',
        rightButtonClass: 'btn-success',
        rightButtonClickHandler: () => this.onRightButtonClick()
      });
    } else {
      this.footerService.setFooterConfig({
        showLeftButton: true,
        leftButtonText: 'Back to Recipes',
        leftButtonIcon: 'fas fa-arrow-left',
        leftButtonClass: 'btn-outline-secondary',
        leftButtonClickHandler: () => this.navigateBackToRecipesList(),
        showRightButton: true,
        rightButtonText: 'Edit Recipe',
        rightButtonIcon: 'fas fa-edit',
        rightButtonClass: 'btn-primary',
        rightButtonClickHandler: () => this.onRightButtonClick()
      });
    }
  }

  onRightButtonClick(): void {
    if (this.isEditingMode) {
      this.saveRecipeChanges();
    } else {
      this.enableEditingMode();
    }
  }

  saveRecipeChanges(): void {
    if (!this.editedRecipe || !this.recipe) return;

    this.isUpdatingRecipe = true;
    this.errorMessage = null;

    const updateRequest: UpdateRecipeRequest = {
      title: this.editedRecipe.title,
      description: this.editedRecipe.description,
      tags: this.editedRecipe.tags,
      ingredients: this.editedRecipe.ingredients,
      recipe: this.editedRecipe.recipe,
      cookbookId: this.editedRecipe.cookbookId,
      page: this.editedRecipe.page,
      mealTypes: this.editedRecipe.mealTypes
    };

    this.recipeService.updateExistingRecipe(this.recipe.id, updateRequest)
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (updatedRecipe) => {
          this.recipe = updatedRecipe;
          this.editedRecipe = { ...updatedRecipe };
          this.isEditingMode = false;
          this.isUpdatingRecipe = false;
          this.updateFooterButtons();
        },
        error: (error) => {
          this.errorMessage = 'Failed to update recipe';
          this.isUpdatingRecipe = false;
          console.error('Error updating recipe:', error);
        }
      });
  }

  addEmptyTag(): void {
    if (!this.editedRecipe) return;
    this.editedRecipe.tags.push('');
  }

  removeTagAtIndex(index: number): void {
    if (!this.editedRecipe || this.editedRecipe.tags.length <= 1) return;
    this.editedRecipe.tags.splice(index, 1);
  }

  addEmptyRecipeStep(): void {
    if (!this.editedRecipe) return;
    this.editedRecipe.recipe.push('');
  }

  removeRecipeStepAtIndex(index: number): void {
    if (!this.editedRecipe || this.editedRecipe.recipe.length <= 1) return;
    this.editedRecipe.recipe.splice(index, 1);
  }

  addEmptyIngredient(): void {
    if (!this.editedRecipe) return;
    this.editedRecipe.ingredients.push({
      name: '',
      type: '',
      amount: {
        value: 0,
        unit: ''
      }
    });
  }

  onIngredientNameChange(index: number, value: string): void {
    if (this.editedRecipe && this.editedRecipe.ingredients[index]) {
      this.editedRecipe.ingredients[index].name = value;
    }
  }

  onAddNewIngredient(ingredientName: string): void {
    // Add the new ingredient to the recipe settings
    if (this.recipeSettings) {
      this.recipeSettings.ingredients.push(ingredientName);
      
      // Update the recipe settings in the backend
      this.recipeSettingsService.updateRecipeSettings({
        tags: this.recipeSettings.tags,
        ingredients: this.recipeSettings.ingredients,
        units: this.recipeSettings.units,
        categories: this.recipeSettings.categories
      }).pipe(takeUntil(this.destroySubject))
        .subscribe({
          next: (updatedSettings) => {
            this.recipeSettings = updatedSettings;
            console.log('New ingredient added to recipe settings:', ingredientName);
          },
          error: (error) => {
            console.error('Error adding new ingredient to recipe settings:', error);
            // Revert the local changes
            this.recipeSettings!.ingredients = this.recipeSettings!.ingredients.filter(ing => ing !== ingredientName);
          }
        });
    }
  }

  removeIngredientAtIndex(index: number): void {
    if (!this.editedRecipe || this.editedRecipe.ingredients.length <= 1) return;
    this.editedRecipe.ingredients.splice(index, 1);
  }

  toggleMealType(mealType: string): void {
    if (!this.editedRecipe) return;
    
    const index = this.editedRecipe.mealTypes.indexOf(mealType);
    if (index > -1) {
      this.editedRecipe.mealTypes.splice(index, 1);
    } else {
      this.editedRecipe.mealTypes.push(mealType);
    }
  }

  isMealTypeSelected(mealType: string): boolean {
    if (!this.editedRecipe) return false;
    return this.editedRecipe.mealTypes.includes(mealType);
  }

  getCookbookTitle(cookbookId?: string): string {
    if (!cookbookId) return 'No cookbook';
    const cookbook = this.cookbooks.find(cb => cb.id === cookbookId);
    return cookbook ? cookbook.title : 'Unknown cookbook';
  }

  getIngredientsByType(): { type: string; ingredients: any[] }[] {
    if (!this.recipe || !this.recipe.ingredients) return [];
    
    const grouped = this.recipe.ingredients.reduce((groups: { [key: string]: any[] }, ingredient) => {
      const type = ingredient.type || 'Overig';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(ingredient);
      return groups;
    }, {});

    return Object.keys(grouped).map(type => ({
      type: type,
      ingredients: grouped[type]
    }));
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  navigateBackToRecipesList(): void {
    this.router.navigate(['/recipes']);
  }

  deleteRecipeWithConfirmation(): void {
    if (!this.recipe) return;
    
    const confirmationMessage = `Are you sure you want to delete "${this.recipe.title}"? This action cannot be undone.`;
    if (confirm(confirmationMessage)) {
      this.recipeService.deleteRecipeById(this.recipe.id)
        .pipe(takeUntil(this.destroySubject))
        .subscribe({
          next: () => {
            this.router.navigate(['/recipes']);
          },
          error: (error) => {
            console.error('Error deleting recipe:', error);
            this.errorMessage = 'Failed to delete recipe. Please try again.';
          }
        });
    }
  }
}

