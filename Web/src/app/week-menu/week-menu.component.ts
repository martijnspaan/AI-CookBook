import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeekCalendarComponent, RecipeAssignment } from './week-calendar/week-calendar.component';
import { RecipeGridComponent } from './recipe-grid/recipe-grid.component';
import { Recipe } from '../models/recipe.model';

@Component({
  selector: 'app-week-menu',
  standalone: true,
  imports: [CommonModule, WeekCalendarComponent, RecipeGridComponent],
  templateUrl: './week-menu.component.html',
  styleUrl: './week-menu.component.scss'
})
export class WeekMenuComponent {
  selectedWeek: Date = new Date();
  selectedMealType: 'breakfast' | 'lunch' | 'dinner' | null = null;
  selectedDate: Date | null = null;
  selectedMealSlot: { mealType: 'breakfast' | 'lunch' | 'dinner'; date: Date } | null = null;
  recipeAssignments: RecipeAssignment[] = [];

  onWeekChanged(week: Date) {
    this.selectedWeek = week;
  }

  onMealSlotClicked(mealType: 'breakfast' | 'lunch' | 'dinner', date: Date) {
    this.selectedMealType = mealType;
    this.selectedDate = date;
    this.selectedMealSlot = { mealType, date };
  }

  onRecipeSelected(event: { recipe: Recipe; mealType: string }) {
    if (this.selectedDate) {
      const dateString = this.selectedDate.toISOString().split('T')[0];
      
      // Remove existing assignment for this meal slot
      this.recipeAssignments = this.recipeAssignments.filter(
        assignment => !(assignment.date === dateString && assignment.mealType === event.mealType)
      );
      
      // Add new assignment
      const newAssignment: RecipeAssignment = {
        date: dateString,
        mealType: event.mealType as 'breakfast' | 'lunch' | 'dinner',
        recipeId: event.recipe.id,
        recipeTitle: event.recipe.title
      };
      
      this.recipeAssignments.push(newAssignment);
    }
    
    this.selectedMealType = null;
    this.selectedDate = null;
    this.selectedMealSlot = null;
  }
}
