import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RecipeService } from '../../services/recipe.service';
import { CookbookService } from '../../services/cookbook.service';
import { Recipe } from '../../models/recipe.model';
import { Cookbook } from '../../models/cookbook.model';
import { RecipeCardComponent } from '../../shared/recipe-card/recipe-card.component';

@Component({
  selector: 'app-recipe-selection-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, RecipeCardComponent],
  templateUrl: './recipe-selection-dialog.component.html',
  styleUrl: './recipe-selection-dialog.component.scss'
})
export class RecipeSelectionDialogComponent implements OnInit, OnDestroy {
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
  isLoadingRecipes = false;
  isLoadingCookbooks = false;
  errorMessage: string | null = null;
  
  selectedMealTypeFilter: string = '';
  selectedCookbookFilter: string = '';
  availableMealTypes: string[] = [];
  
  private readonly destroySubject = new Subject<void>();

  constructor(
    private readonly recipeService: RecipeService,
    private readonly cookbookService: CookbookService
  ) {}

  ngOnInit(): void {
    if (this.isVisible) {
      this.loadAllRecipes();
      this.loadCookbooks();
    }
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  ngOnChanges(): void {
    if (this.isVisible) {
      this.loadAllRecipes();
      this.loadCookbooks();
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
          this.isLoadingCookbooks = false;
        },
        error: (error) => {
          console.error('Error loading cookbooks:', error);
          this.isLoadingCookbooks = false;
        }
      });
  }

  extractAvailableMealTypes(recipes: Recipe[]): void {
    const mealTypes = new Set<string>();
    recipes.forEach(recipe => {
      recipe.mealTypes.forEach(mealType => {
        mealTypes.add(mealType);
      });
    });
    this.availableMealTypes = Array.from(mealTypes).sort();
  }

  applyFilters(): void {
    let filtered = [...this.allRecipes];

    if (this.selectedMealTypeFilter) {
      filtered = filtered.filter(recipe => 
        recipe.mealTypes.includes(this.selectedMealTypeFilter)
      );
    }

    if (this.selectedCookbookFilter) {
      filtered = filtered.filter(recipe => 
        recipe.cookbookId === this.selectedCookbookFilter
      );
    }

    this.filteredRecipes = filtered;
    this.recipes = this.filteredRecipes;
  }

  onMealTypeFilterChange(): void {
    this.applyFilters();
  }

  onCookbookFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.selectedMealTypeFilter = '';
    this.selectedCookbookFilter = '';
    this.applyFilters();
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
