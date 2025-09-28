import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecipeAssignment } from '../week-calendar/week-calendar.component';
import { GroceryListService } from '../../services/grocery-list.service';
import { GroceryList } from '../../models/grocery-list.model';
import { ReusablePopupComponent, PopupConfig } from '../../shared/reusable-popup';

export interface ShoppingDayOption {
  date: Date;
  displayText: string;
}

export interface MealSelection {
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  recipeTitle: string;
  recipeId: string;
  isSelected: boolean;
  isAlreadyUsed: boolean;
}

@Component({
  selector: 'app-grocery-shopping-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReusablePopupComponent],
  templateUrl: './grocery-shopping-dialog.component.html',
  styleUrl: './grocery-shopping-dialog.component.scss'
})
export class GroceryShoppingDialogComponent implements OnInit, OnChanges {
  @Input() isVisible: boolean = false;
  @Input() recipeAssignments: RecipeAssignment[] = [];
  @Output() dialogClosed = new EventEmitter<void>();
  @Output() shoppingListCreated = new EventEmitter<{ selectedDay: Date; selectedMeals: MealSelection[] }>();

  selectedShoppingDay: Date = new Date();
  shoppingDayOptions: ShoppingDayOption[] = [];
  mealSelections: MealSelection[] = [];
  mealsByDate: { date: string; meals: MealSelection[] }[] = [];
  existingGroceryLists: GroceryList[] = [];
  isLoadingGroceryLists: boolean = false;

  popupConfig: PopupConfig = {
    title: 'Create Grocery List',
    showCloseButton: true,
    size: 'lg',
    height: 'lg',
    showBackdrop: true,
    closeOnBackdropClick: true,
    closeOnEscape: true
  };

  constructor(private groceryListService: GroceryListService) {}

  ngOnInit(): void {
    this.generateShoppingDayOptions();
    this.loadExistingGroceryLists();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && changes['isVisible'].currentValue === true) {
      this.generateShoppingDayOptions();
      this.loadExistingGroceryLists();
    }
    if (changes['recipeAssignments']) {
      this.generateMealSelections();
    }
  }

  private generateShoppingDayOptions(): void {
    const today = new Date();
    this.shoppingDayOptions = [];
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const displayText = `${dayName}, ${dateString}`;
      
      this.shoppingDayOptions.push({
        date: date,
        displayText: displayText
      });
    }
    
    this.selectedShoppingDay = this.shoppingDayOptions[0].date;
  }

  private loadExistingGroceryLists(): void {
    this.isLoadingGroceryLists = true;
    this.groceryListService.getAllGroceryLists().subscribe({
      next: (groceryLists) => {
        this.existingGroceryLists = groceryLists;
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
    this.mealSelections = [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const alreadyUsedMeals = this.getAlreadyUsedMeals();
    
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
        const isAlreadyUsed = this.isMealAlreadyUsed(assignment, alreadyUsedMeals);
        
        this.mealSelections.push({
          date: assignment.date,
          mealType: assignment.mealType,
          recipeTitle: assignment.recipeTitle,
          recipeId: assignment.recipeId,
          isSelected: !isAlreadyUsed,
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

  private isMealAlreadyUsed(assignment: RecipeAssignment, alreadyUsedMeals: Set<string>): boolean {
    const mealKey = this.createMealKey(assignment.date, assignment.mealType, assignment.recipeId);
    return alreadyUsedMeals.has(mealKey);
  }

  private createMealKey(date: string, mealType: string, recipeId: string | undefined): string {
    // Normalize date to YYYY-MM-DD format for consistent comparison
    const normalizedDate = this.normalizeDate(date);
    return `${normalizedDate}|${mealType}|${recipeId || ''}`;
  }

  private normalizeDate(dateString: string): string {
    try {
      // If it's already in YYYY-MM-DD format, return as is
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
      }
      
      // If it's an ISO 8601 string, extract just the date part
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error normalizing date:', dateString, error);
      return dateString; // Return original if parsing fails
    }
  }

  onShoppingDayChanged(): void {
    // You can add logic here if needed when shopping day changes
  }

  onMealSelectionChanged(meal: MealSelection): void {
    // Update the selection
    const index = this.mealSelections.findIndex(m => 
      m.date === meal.date && m.mealType === meal.mealType
    );
    if (index !== -1) {
      this.mealSelections[index].isSelected = meal.isSelected;
      // No need to call updateMealsByDate() as it only changes the isSelected property
      // and doesn't affect the structure of mealsByDate
    }
  }


  getSelectedMealsCount(): number {
    return this.mealSelections.filter(meal => meal.isSelected && !meal.isAlreadyUsed).length;
  }

  createShoppingList(): void {
    const selectedMeals = this.mealSelections.filter(meal => meal.isSelected && !meal.isAlreadyUsed);
    this.shoppingListCreated.emit({
      selectedDay: this.selectedShoppingDay,
      selectedMeals: selectedMeals
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
      // Parse dates properly for sorting to avoid timezone issues
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
    // Parse date string properly to avoid timezone issues
    let date: Date;
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Parse YYYY-MM-DD as local date
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day); // month is 0-indexed
    } else {
      // Fallback to normal parsing
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
