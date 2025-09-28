import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroceryListService } from '../../services/grocery-list.service';
import { RecipeService } from '../../services/recipe.service';
import { GroceryList, Meal } from '../../models/grocery-list.model';
import { Recipe } from '../../models/recipe.model';
import { ReusablePopupComponent, PopupConfig } from '../../shared/reusable-popup';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// Import the RecipeAssignment interface from week-calendar
interface RecipeAssignment {
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  recipeId: string;
  recipeTitle: string;
}

export interface MealSelection {
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  recipeTitle: string;
  recipeId: string;
  isSelected: boolean;
  isAlreadyUsed: boolean;
}

interface MealWithRecipe extends Meal {
  recipeTitle?: string;
}

@Component({
  selector: 'app-edit-grocery-list-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReusablePopupComponent],
  templateUrl: './edit-grocery-list-dialog.component.html',
  styleUrl: './edit-grocery-list-dialog.component.scss'
})
export class EditGroceryListDialogComponent implements OnInit, OnChanges {
  @Input() isVisible: boolean = false;
  @Input() groceryList: GroceryList | null = null;
  @Input() recipeAssignments: RecipeAssignment[] = [];
  @Output() dialogClosed = new EventEmitter<void>();
  @Output() groceryListUpdated = new EventEmitter<GroceryList>();

  selectedGroceryDay: Date = new Date();
  mealSelections: MealSelection[] = [];
  mealsByDate: { date: string; meals: MealSelection[] }[] = [];
  existingGroceryLists: GroceryList[] = [];
  isLoadingGroceryLists: boolean = false;
  isLoadingRecipes: boolean = false;
  isUpdating: boolean = false;

  popupConfig: PopupConfig = {
    title: 'Edit Grocery List',
    icon: 'fas fa-edit',
    showCloseButton: true,
    size: 'lg',
    height: 'lg',
    showBackdrop: true,
    closeOnBackdropClick: true,
    closeOnEscape: true
  };

  constructor(
    private groceryListService: GroceryListService,
    private recipeService: RecipeService
  ) {}

  ngOnInit(): void {
    this.loadExistingGroceryLists();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && changes['isVisible'].currentValue === true && this.groceryList) {
      this.initializeForEdit();
    }
    if (changes['groceryList'] && this.groceryList) {
      this.initializeForEdit();
    }
    if (changes['recipeAssignments']) {
      this.generateMealSelections();
    }
  }

  private initializeForEdit(): void {
    if (!this.groceryList) return;

    // Set the selected grocery day
    this.selectedGroceryDay = new Date(this.groceryList.dayOfGrocery);
    
    // Generate meal selections from all available meals
    this.generateMealSelections();
  }

  private loadRecipesForMeals(): void {
    if (!this.groceryList) return;

    this.isLoadingRecipes = true;
    
    // Get unique recipe IDs from the grocery list meals
    const recipeIds = new Set<string>();
    this.groceryList.meals.forEach(meal => {
      if (meal.recipeId) {
        recipeIds.add(meal.recipeId);
      }
    });

    if (recipeIds.size === 0) {
      this.generateMealSelections();
      this.isLoadingRecipes = false;
      return;
    }

    // Fetch all recipes in parallel
    const recipeObservables = Array.from(recipeIds).map(id =>
      this.recipeService.getRecipeById(id).pipe(
        catchError((error) => {
          console.error(`Error fetching recipe ${id}:`, error);
          return of(null);
        })
      )
    );

    forkJoin(recipeObservables).subscribe({
      next: (recipes) => {
        // Create a map of recipe ID to recipe title
        const recipeMap = new Map<string, string>();
        recipes.forEach(recipe => {
          if (recipe) {
            recipeMap.set(recipe.id, recipe.title);
          }
        });

        // Update the grocery list with recipe titles
        const groceryListWithRecipes = {
          ...this.groceryList!,
          meals: this.groceryList!.meals.map(meal => ({
            ...meal,
            recipeTitle: meal.recipeId ? recipeMap.get(meal.recipeId) : undefined
          }))
        };

        this.groceryList = groceryListWithRecipes;
        this.generateMealSelections();
        this.isLoadingRecipes = false;
      },
      error: (error) => {
        console.error('Error loading recipes:', error);
        this.generateMealSelections();
        this.isLoadingRecipes = false;
      }
    });
  }

  getFormattedGroceryDay(): string {
    if (!this.selectedGroceryDay) return '';
    
    const dayName = this.selectedGroceryDay.toLocaleDateString('en-US', { weekday: 'long' });
    const dateString = this.selectedGroceryDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return `${dayName}, ${dateString}`;
  }

  private loadExistingGroceryLists(): void {
    this.isLoadingGroceryLists = true;
    this.groceryListService.getAllGroceryLists().subscribe({
      next: (groceryLists) => {
        // Filter out the current grocery list being edited
        this.existingGroceryLists = groceryLists.filter(gl => gl.id !== this.groceryList?.id);
        this.generateMealSelections();
        this.isLoadingGroceryLists = false;
      },
      error: (error) => {
        console.error('Error loading existing grocery lists:', error);
        this.generateMealSelections();
        this.isLoadingGroceryLists = false;
      }
    });
  }

  private generateMealSelections(): void {
    if (!this.recipeAssignments || this.recipeAssignments.length === 0) return;

    this.mealSelections = [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const alreadyUsedMeals = this.getAlreadyUsedMeals();
    
    // Get the meals that are currently in the grocery list being edited
    const currentGroceryListMeals = new Set<string>();
    if (this.groceryList) {
      this.groceryList.meals.forEach(meal => {
        const key = this.createMealKey(meal.dayOfMeal, meal.mealType, meal.recipeId);
        currentGroceryListMeals.add(key);
      });
    }
    
    // Generate meal selections from all recipe assignments
    this.recipeAssignments.forEach(assignment => {
      // Parse assignment.date (which is in YYYY-MM-DD format) as local date to avoid timezone issues
      let mealDate: Date;
      if (assignment.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Parse YYYY-MM-DD as local date
        const [year, month, day] = assignment.date.split('-').map(Number);
        mealDate = new Date(year, month - 1, day); // month is 0-indexed
      } else {
        // Fallback to normal parsing
        mealDate = new Date(assignment.date);
      }
      mealDate.setHours(0, 0, 0, 0);
      
      if (mealDate >= today) {
        const isAlreadyUsed = this.isAssignmentAlreadyUsed(assignment, alreadyUsedMeals);
        const isInCurrentGroceryList = currentGroceryListMeals.has(this.createMealKey(assignment.date, assignment.mealType, assignment.recipeId));
        
        this.mealSelections.push({
          date: assignment.date,
          mealType: assignment.mealType,
          recipeTitle: assignment.recipeTitle,
          recipeId: assignment.recipeId,
          isSelected: isInCurrentGroceryList, // Selected if it's in the current grocery list
          isAlreadyUsed: isAlreadyUsed
        });
      }
    });
    
    this.updateMealsByDate();
  }

  private getAlreadyUsedMeals(): Set<string> {
    const alreadyUsedMeals = new Set<string>();
    
    this.existingGroceryLists.forEach(groceryList => {
      groceryList.meals.forEach(meal => {
        const mealKey = this.createMealKey(meal.dayOfMeal, meal.mealType, meal.recipeId);
        alreadyUsedMeals.add(mealKey);
      });
    });
    
    return alreadyUsedMeals;
  }

  private isMealAlreadyUsed(meal: Meal, alreadyUsedMeals: Set<string>): boolean {
    const mealKey = this.createMealKey(meal.dayOfMeal, meal.mealType, meal.recipeId);
    return alreadyUsedMeals.has(mealKey);
  }

  private isAssignmentAlreadyUsed(assignment: RecipeAssignment, alreadyUsedMeals: Set<string>): boolean {
    const mealKey = this.createMealKey(assignment.date, assignment.mealType, assignment.recipeId);
    return alreadyUsedMeals.has(mealKey);
  }

  private createMealKey(date: string, mealType: string, recipeId: string | undefined): string {
    const normalizedDate = this.normalizeDate(date);
    return `${normalizedDate}|${mealType}|${recipeId || ''}`;
  }

  private normalizeDate(dateString: string): string {
    try {
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
      }
      
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error normalizing date:', dateString, error);
      return dateString;
    }
  }


  onMealSelectionChanged(meal: MealSelection): void {
    const index = this.mealSelections.findIndex(m => 
      m.date === meal.date && m.mealType === meal.mealType
    );
    if (index !== -1) {
      this.mealSelections[index].isSelected = meal.isSelected;
    }
  }

  getSelectedMealsCount(): number {
    return this.mealSelections.filter(meal => meal.isSelected && !meal.isAlreadyUsed).length;
  }

  updateGroceryList(): void {
    if (!this.groceryList) return;

    this.isUpdating = true;
    const selectedMeals = this.mealSelections.filter(meal => meal.isSelected && !meal.isAlreadyUsed);
    
    // Convert MealSelection to Meal format for the API
    const meals = selectedMeals.map(meal => {
      return {
        dayOfMeal: meal.date,
        mealType: meal.mealType,
        recipeId: meal.recipeId
      };
    });

    const groceryListRequest = {
      dayOfGrocery: this.selectedGroceryDay.toISOString(),
      meals: meals
    };

    this.groceryListService.updateGroceryList(this.groceryList.id, groceryListRequest).subscribe({
      next: (updatedGroceryList) => {
        this.isUpdating = false;
        this.groceryListUpdated.emit(updatedGroceryList);
        this.closeDialog();
      },
      error: (error) => {
        console.error('Error updating grocery list:', error);
        this.isUpdating = false;
      }
    });
  }

  closeDialog(): void {
    this.dialogClosed.emit();
  }

  private updateMealsByDate(): void {
    const mealsByDate = new Map<string, MealSelection[]>();
    
    this.mealSelections.forEach(meal => {
      if (!mealsByDate.has(meal.date)) {
        mealsByDate.set(meal.date, []);
      }
      mealsByDate.get(meal.date)!.push(meal);
    });
    
    this.mealsByDate = Array.from(mealsByDate.entries()).map(([date, meals]) => ({
      date,
      meals: meals.sort((a, b) => {
        const mealOrder = { 'breakfast': 1, 'lunch': 2, 'dinner': 3 };
        return mealOrder[a.mealType] - mealOrder[b.mealType];
      })
    })).sort((a, b) => {
      const parseDate = (dateStr: string): Date => {
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dateStr.split('-').map(Number);
          return new Date(year, month - 1, day);
        } else {
          return new Date(dateStr);
        }
      };
      return parseDate(a.date).getTime() - parseDate(b.date).getTime();
    });
  }

  getDisplayDate(dateString: string): string {
    let date: Date;
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(dateString);
    }
    
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStringFormatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${dayName}, ${dateStringFormatted}`;
  }

  getMealTypeLabel(mealType: string): string {
    return mealType.charAt(0).toUpperCase() + mealType.slice(1);
  }
}
