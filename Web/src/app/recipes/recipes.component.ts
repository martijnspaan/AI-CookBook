import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RecipeService } from '../services/recipe.service';
import { CookbookService } from '../services/cookbook.service';
import { RecipeModalService } from '../services/recipe-modal.service';
import { RecipeSettingsService } from '../services/recipe-settings.service';
import { Recipe, Ingredient, CreateRecipeRequest } from '../models/recipe.model';
import { Cookbook } from '../models/cookbook.model';
import { RecipeSettings } from '../models/recipe-settings.model';
import { PageTitleService } from '../services/page-title.service';
import { RecipeCardComponent } from '../shared/recipe-card/recipe-card.component';
import { ReusablePopupComponent, PopupConfig } from '../shared/reusable-popup';
import { IngredientAutocompleteComponent } from '../shared/ingredient-autocomplete/ingredient-autocomplete.component';

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RecipeCardComponent, ReusablePopupComponent, IngredientAutocompleteComponent],
  templateUrl: './recipes.component.html',
  styleUrl: './recipes.component.scss'
})
export class RecipesComponent implements OnInit, OnDestroy, AfterViewInit {
  recipes: Recipe[] = [];
  cookbooks: Cookbook[] = [];
  recipeSettings: RecipeSettings | null = null;
  isLoadingRecipes = false;
  isLoadingCookbooks = false;
  isLoadingRecipeSettings = false;
  isCreatingRecipe = false;
  errorMessage: string | null = null;
  createRecipeForm: FormGroup;
  availableMealTypes: string[] = [];
  availableIngredientTypes: string[] = [];
  availableUnits: string[] = [];
  showCreateRecipeModal = false;
  private readonly destroySubject = new Subject<void>();

  createRecipePopupConfig: PopupConfig = {
    title: 'Create New Recipe',
    icon: 'fas fa-utensils',
    showCloseButton: true,
    size: 'xl',
    height: 'lg',
    showBackdrop: true,
    closeOnBackdropClick: false,
    closeOnEscape: true
  };

  constructor(
    private readonly recipeService: RecipeService,
    private readonly cookbookService: CookbookService,
    private readonly recipeModalService: RecipeModalService,
    private readonly recipeSettingsService: RecipeSettingsService,
    private readonly router: Router,
    private readonly formBuilder: FormBuilder,
    private readonly pageTitleService: PageTitleService
  ) {
    this.createRecipeForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      tags: this.formBuilder.array([]),
      cookbookId: [''],
      page: [null],
      mealTypes: this.formBuilder.array([]),
      ingredients: this.formBuilder.array([]),
      recipeSteps: this.formBuilder.array([])
    });
  }

  ngOnInit(): void {
    this.loadAllRecipes();
    this.loadAllCookbooks();
    this.loadRecipeSettings();
    
    // Subscribe to recipe modal service
    this.recipeModalService.openModal$
      .pipe(takeUntil(this.destroySubject))
      .subscribe(() => {
        this.openCreateRecipeModal();
      });
  }

  ngAfterViewInit(): void {
    this.pageTitleService.setPageTitle('Recipe Collection');
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  get ingredientsFormArray(): FormArray {
    return this.createRecipeForm.get('ingredients') as FormArray;
  }

  get recipeStepsFormArray(): FormArray {
    return this.createRecipeForm.get('recipeSteps') as FormArray;
  }

  get mealTypesFormArray(): FormArray {
    return this.createRecipeForm.get('mealTypes') as FormArray;
  }

  get tagsFormArray(): FormArray {
    return this.createRecipeForm.get('tags') as FormArray;
  }

  loadAllRecipes(): void {
    this.isLoadingRecipes = true;
    this.errorMessage = null;
    
    this.recipeService.getAllRecipes()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (recipes) => {
          this.recipes = recipes;
          this.isLoadingRecipes = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load recipes. Please make sure the API is running.';
          this.isLoadingRecipes = false;
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

  loadRecipeSettings(): void {
    this.isLoadingRecipeSettings = true;
    
    this.recipeSettingsService.getRecipeSettings()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (settings) => {
          this.recipeSettings = settings;
          if (settings) {
            // Meal types are always fixed: Breakfast, Lunch, Dinner
            this.availableMealTypes = ['Breakfast', 'Lunch', 'Dinner'];
            this.availableIngredientTypes = settings.categories || ['groente', 'fruit', 'olie', 'zuivel', 'kruid', 'anders'];
            this.availableUnits = settings.units || ['mg', 'g', 'kg', 'ml', 'dl', 'l', 'tbsp', 'tsp', 'cup', 'piece', 'pinch'];
          } else {
            // Fallback to default values if no settings found
            this.availableMealTypes = ['Breakfast', 'Lunch', 'Dinner'];
            this.availableIngredientTypes = ['groente', 'fruit', 'olie', 'zuivel', 'kruid', 'anders'];
            this.availableUnits = ['mg', 'g', 'kg', 'ml', 'dl', 'l', 'tbsp', 'tsp', 'cup', 'piece', 'pinch'];
          }
          this.isLoadingRecipeSettings = false;
        },
        error: (error) => {
          console.error('Error loading recipe settings:', error);
          // Fallback to default values on error
          this.availableMealTypes = ['Breakfast', 'Lunch', 'Dinner'];
          this.availableIngredientTypes = ['groente', 'fruit', 'olie', 'zuivel', 'kruid', 'anders'];
          this.availableUnits = ['mg', 'g', 'kg', 'ml', 'dl', 'l', 'tbsp', 'tsp', 'cup', 'piece', 'pinch'];
          this.isLoadingRecipeSettings = false;
        }
      });
  }

  getTagsAsCommaSeparatedString(tags: string[]): string {
    return tags.join(', ');
  }

  getCookbookTitle(cookbookId?: string): string {
    if (!cookbookId) return 'No cookbook';
    const cookbook = this.cookbooks.find(cb => cb.id === cookbookId);
    return cookbook ? cookbook.title : 'Unknown cookbook';
  }

  navigateToRecipeDetails(recipe: Recipe): void {
    this.router.navigate(['/recipes', recipe.id]);
  }

  deleteRecipeWithConfirmation(recipe: Recipe, event: Event): void {
    event.stopPropagation();
    
    const confirmationMessage = `Are you sure you want to delete "${recipe.title}"?`;
    if (confirm(confirmationMessage)) {
      this.recipeService.deleteRecipeById(recipe.id)
        .pipe(takeUntil(this.destroySubject))
        .subscribe({
          next: () => {
            this.recipes = this.recipes.filter(existingRecipe => existingRecipe.id !== recipe.id);
          },
          error: (error) => {
            console.error('Error deleting recipe:', error);
            alert('Failed to delete recipe. Please try again.');
          }
        });
    }
  }


  public openCreateRecipeModal(): void {
    this.resetCreateRecipeForm();
    this.addEmptyIngredient();
    this.addEmptyRecipeStep();
    this.addEmptyTag();
    this.showCreateRecipeModal = true;
  }

  private resetCreateRecipeForm(): void {
    this.createRecipeForm.reset();
    this.ingredientsFormArray.clear();
    this.recipeStepsFormArray.clear();
    this.tagsFormArray.clear();
    this.initializeMealTypes();
  }

  private showBootstrapModal(): void {
    const modalElement = document.getElementById('createRecipeModal');
    if (modalElement) {
      const bootstrapModal = (window as any).bootstrap?.Modal;
      if (bootstrapModal) {
        const modalInstance = new bootstrapModal(modalElement);
        modalInstance.show();
      } else {
        this.showModalFallback(modalElement);
      }
    }
  }

  private showModalFallback(modalElement: HTMLElement): void {
    modalElement.classList.add('show');
    modalElement.style.display = 'block';
    modalElement.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    
    const backdropElement = document.createElement('div');
    backdropElement.className = 'modal-backdrop fade show';
    backdropElement.id = 'modal-backdrop';
    document.body.appendChild(backdropElement);
  }

  addEmptyIngredient(): void {
    const ingredientFormGroup = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      amountValue: [0, [Validators.required, Validators.min(0.1)]],
      amountUnit: [null, [Validators.required]],
      type: [null, [Validators.required]]
    });
    this.ingredientsFormArray.push(ingredientFormGroup);
  }

  removeIngredientAtIndex(index: number): void {
    if (this.ingredientsFormArray.length > 1) {
      this.ingredientsFormArray.removeAt(index);
    }
  }

  addEmptyRecipeStep(): void {
    const recipeStepControl = this.formBuilder.control('', [Validators.required, Validators.minLength(5)]);
    this.recipeStepsFormArray.push(recipeStepControl);
  }

  removeRecipeStepAtIndex(index: number): void {
    if (this.recipeStepsFormArray.length > 1) {
      this.recipeStepsFormArray.removeAt(index);
    }
  }

  addEmptyTag(): void {
    const tagControl = this.formBuilder.control('', [Validators.required, Validators.minLength(1)]);
    this.tagsFormArray.push(tagControl);
  }

  removeTagAtIndex(index: number): void {
    if (this.tagsFormArray.length > 1) {
      this.tagsFormArray.removeAt(index);
    }
  }

  initializeMealTypes(): void {
    this.mealTypesFormArray.clear();
    this.availableMealTypes.forEach(mealType => {
      this.mealTypesFormArray.push(this.formBuilder.control(false));
    });
  }

  toggleMealType(index: number): void {
    const control = this.mealTypesFormArray.at(index);
    control.setValue(!control.value);
  }

  isMealTypeSelected(index: number): boolean {
    return this.mealTypesFormArray.at(index).value;
  }

  submitCreateRecipeForm(): void {
    if (this.isCreateButtonEnabled()) {
      this.isCreatingRecipe = true;
      
      const formData = this.createRecipeForm.value;
      const createRecipeRequest = this.buildCreateRecipeRequest(formData);
      

      this.recipeService.createNewRecipe(createRecipeRequest)
        .pipe(takeUntil(this.destroySubject))
        .subscribe({
          next: (createdRecipe) => {
            this.recipes.unshift(createdRecipe);
            this.isCreatingRecipe = false;
            this.showCreateRecipeModal = false;
          },
          error: (error) => {
            console.error('Error creating recipe:', error);
            this.isCreatingRecipe = false;
            alert('Failed to create recipe. Please try again.');
          }
        });
    }
  }

  private buildCreateRecipeRequest(formData: any): CreateRecipeRequest {
    const tags = this.getTagsFromFormArray();
    const ingredients = this.transformFormIngredientsToModel(formData.ingredients);
    const mealTypes = this.getSelectedMealTypes();
    const recipeSteps = this.getRecipeStepsFromFormArray();

    return {
      title: formData.title,
      description: formData.description || '',
      tags: tags,
      ingredients: ingredients,
      recipe: recipeSteps,
      cookbookId: formData.cookbookId || undefined,
      page: formData.page || undefined,
      mealTypes: mealTypes
    };
  }

  private getSelectedMealTypes(): string[] {
    const selectedMealTypes: string[] = [];
    this.mealTypesFormArray.controls.forEach((control, index) => {
      if (control.value) {
        selectedMealTypes.push(this.availableMealTypes[index]);
      }
    });
    return selectedMealTypes;
  }

  private getTagsFromFormArray(): string[] {
    return this.tagsFormArray.controls
      .map(control => control.value)
      .filter(tag => tag && tag.trim().length > 0);
  }

  private getRecipeStepsFromFormArray(): string[] {
    return this.recipeStepsFormArray.controls
      .map(control => control.value)
      .filter(step => step && step.trim().length > 0);
  }

  private transformFormIngredientsToModel(formIngredients: any[]): Ingredient[] {
    return formIngredients
      .filter(ingredient => ingredient.name && ingredient.name.trim().length > 0)
      .map(ingredient => ({
        name: ingredient.name,
        type: ingredient.type,
        amount: {
          value: ingredient.amountValue,
          unit: ingredient.amountUnit
        }
      }));
  }

  hideCreateRecipeModal(): void {
    const modalElement = document.getElementById('createRecipeModal');
    if (modalElement) {
      const bootstrapModal = (window as any).bootstrap?.Modal;
      if (bootstrapModal) {
        const modalInstance = bootstrapModal.getInstance(modalElement);
        if (modalInstance) {
          modalInstance.hide();
        }
      } else {
        this.hideModalFallback(modalElement);
      }
    }
  }

  private hideModalFallback(modalElement: HTMLElement): void {
    modalElement.classList.remove('show');
    modalElement.style.display = 'none';
    modalElement.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    
    const backdropElement = document.getElementById('modal-backdrop');
    if (backdropElement) {
      backdropElement.remove();
    }
  }

  cancelCreateRecipe(): void {
    this.showCreateRecipeModal = false;
  }

  isCreateButtonEnabled(): boolean {
    const titleControl = this.createRecipeForm.get('title');
    const isValid = titleControl?.valid || false;
    return isValid;
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
}
