import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
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
  
  selectedMealTypeFilters: string[] = [];
  selectedCookbookFilters: string[] = [];
  availableMealTypes: string[] = [];
  
  showMealTypeDropdown = false;
  showCookbookDropdown = false;
  
  private readonly destroySubject = new Subject<void>();

  constructor(
    private readonly recipeService: RecipeService,
    private readonly cookbookService: CookbookService,
    private readonly cdr: ChangeDetectorRef
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

    this.filteredRecipes = filtered;
    this.recipes = this.filteredRecipes;
  }


  clearFilters(): void {
    this.selectedMealTypeFilters = [];
    this.selectedCookbookFilters = [];
    this.applyFilters();
  }

  toggleMealTypeFilter(mealType: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    const index = this.selectedMealTypeFilters.indexOf(mealType);
    if (index > -1) {
      this.selectedMealTypeFilters.splice(index, 1);
    } else {
      this.selectedMealTypeFilters.push(mealType);
    }
    
    this.applyFilters();
    
    // Close dropdown to show the updated text
    setTimeout(() => {
      this.showMealTypeDropdown = false;
      this.cdr.detectChanges();
    }, 10);
  }

  toggleCookbookFilter(cookbookId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    const index = this.selectedCookbookFilters.indexOf(cookbookId);
    if (index > -1) {
      this.selectedCookbookFilters.splice(index, 1);
    } else {
      this.selectedCookbookFilters.push(cookbookId);
    }
    
    this.applyFilters();
    
    // Close dropdown to show the updated text
    setTimeout(() => {
      this.showCookbookDropdown = false;
      this.cdr.detectChanges();
    }, 10);
  }

  isMealTypeSelected(mealType: string): boolean {
    return this.selectedMealTypeFilters.includes(mealType);
  }

  isCookbookSelected(cookbookId: string): boolean {
    return this.selectedCookbookFilters.includes(cookbookId);
  }


  getMealTypeDisplayText(): string {
    if (this.selectedMealTypeFilters.length === 0) {
      return 'All Meal Types';
    } else if (this.selectedMealTypeFilters.length === 1) {
      return this.selectedMealTypeFilters[0];
    } else {
      return `${this.selectedMealTypeFilters.length} types selected`;
    }
  }

  getCookbookDisplayText(): string {
    if (this.selectedCookbookFilters.length === 0) {
      return 'All Cookbooks';
    } else if (this.selectedCookbookFilters.length === 1) {
      const cookbook = this.cookbooks.find(c => c.id === this.selectedCookbookFilters[0]);
      return cookbook ? cookbook.title : 'Unknown Cookbook';
    } else {
      return `${this.selectedCookbookFilters.length} cookbooks selected`;
    }
  }

  toggleMealTypeDropdown(): void {
    const wasOpen = this.showMealTypeDropdown;
    this.showMealTypeDropdown = !this.showMealTypeDropdown;
    this.showCookbookDropdown = false;
    
    // If we're closing the dropdown, force display text update
    if (wasOpen && !this.showMealTypeDropdown) {
      this.cdr.detectChanges();
    }
  }

  toggleCookbookDropdown(): void {
    const wasOpen = this.showCookbookDropdown;
    this.showCookbookDropdown = !this.showCookbookDropdown;
    this.showMealTypeDropdown = false;
    
    // If we're closing the dropdown, force display text update
    if (wasOpen && !this.showCookbookDropdown) {
      this.cdr.detectChanges();
    }
  }

  onMealTypeDropdownBlur(): void {
    // Force display text update when button loses focus
    if (this.showMealTypeDropdown) {
      this.showMealTypeDropdown = false;
    }
    // Always trigger change detection to ensure display text is updated
    this.cdr.detectChanges();
  }

  onCookbookDropdownBlur(): void {
    // Force display text update when button loses focus
    if (this.showCookbookDropdown) {
      this.showCookbookDropdown = false;
    }
    // Always trigger change detection to ensure display text is updated
    this.cdr.detectChanges();
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Close dropdowns when clicking outside
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown')) {
      const wasMealTypeOpen = this.showMealTypeDropdown;
      const wasCookbookOpen = this.showCookbookDropdown;
      
      this.showMealTypeDropdown = false;
      this.showCookbookDropdown = false;
      
      // Trigger change detection if dropdowns were open
      if (wasMealTypeOpen || wasCookbookOpen) {
        this.cdr.detectChanges();
      }
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
