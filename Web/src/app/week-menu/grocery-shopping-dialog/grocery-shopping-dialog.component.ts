import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecipeAssignment } from '../week-calendar/week-calendar.component';

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
}

@Component({
  selector: 'app-grocery-shopping-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  ngOnInit(): void {
    this.generateShoppingDayOptions();
    this.generateMealSelections();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && changes['isVisible'].currentValue === true) {
      this.generateShoppingDayOptions();
      this.generateMealSelections();
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

  private generateMealSelections(): void {
    this.mealSelections = [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.recipeAssignments.forEach(assignment => {
      const mealDate = new Date(assignment.date);
      mealDate.setHours(0, 0, 0, 0);
      
      if (mealDate >= today) {
        this.mealSelections.push({
          date: assignment.date,
          mealType: assignment.mealType,
          recipeTitle: assignment.recipeTitle,
          recipeId: assignment.recipeId,
          isSelected: true
        });
      }
    });
    
    this.updateMealsByDate();
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
      this.updateMealsByDate();
    }
  }


  getSelectedMealsCount(): number {
    return this.mealSelections.filter(meal => meal.isSelected).length;
  }

  createShoppingList(): void {
    const selectedMeals = this.mealSelections.filter(meal => meal.isSelected);
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
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  getDisplayDate(dateString: string): string {
    const date = new Date(dateString);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStringFormatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${dayName}, ${dateStringFormatted}`;
  }

  getMealTypeLabel(mealType: string): string {
    return mealType.charAt(0).toUpperCase() + mealType.slice(1);
  }
}
