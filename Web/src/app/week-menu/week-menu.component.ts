import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeekCalendarComponent, RecipeAssignment } from './week-calendar/week-calendar.component';
import { RecipeSelectionDialogComponent } from './recipe-selection-dialog/recipe-selection-dialog.component';
import { Recipe } from '../models/recipe.model';
import { PageTitleService } from '../services/page-title.service';
import { WeekMenuService } from '../services/week-menu.service';
import { WeekMenu, WeekDay, CreateOrUpdateWeekMenuRequest } from '../models/week-menu.model';

@Component({
  selector: 'app-week-menu',
  standalone: true,
  imports: [CommonModule, WeekCalendarComponent, RecipeSelectionDialogComponent],
  templateUrl: './week-menu.component.html',
  styleUrl: './week-menu.component.scss'
})
export class WeekMenuComponent implements OnInit, AfterViewInit {
  selectedWeek: Date = new Date();
  selectedMealType: 'breakfast' | 'lunch' | 'dinner' | null = null;
  selectedDate: Date | null = null;
  selectedMealSlot: { mealType: 'breakfast' | 'lunch' | 'dinner'; date: Date } | null = null;
  recipeAssignments: RecipeAssignment[] = [];
  showRecipeDialog: boolean = false;
  currentWeekMenu: WeekMenu | null = null;
  isSaving: boolean = false;

  constructor(
    private pageTitleService: PageTitleService,
    private weekMenuService: WeekMenuService
  ) {}

  ngOnInit(): void {
    this.loadWeekMenus();
  }

  ngAfterViewInit(): void {
    this.pageTitleService.setPageTitle('Create Week Menu');
  }

  onWeekChanged(week: Date) {
    this.selectedWeek = week;
    this.loadWeekMenus();
  }

  onMealSlotClicked(mealType: 'breakfast' | 'lunch' | 'dinner', date: Date) {
    this.selectedMealType = mealType;
    this.selectedDate = date;
    this.selectedMealSlot = { mealType, date };
    this.showRecipeDialog = true;
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
      
      // Save to API
      this.saveWeekMenuToApi();
    }
    
    this.resetSelection();
  }

  onDialogClosed(): void {
    this.resetSelection();
  }

  private resetSelection(): void {
    this.selectedMealType = null;
    this.selectedDate = null;
    this.selectedMealSlot = null;
    this.showRecipeDialog = false;
  }

  private loadWeekMenus(): void {
    this.weekMenuService.getWeekMenus().subscribe({
      next: (weekMenus) => {
        const weekNumber = this.getWeekNumber(this.selectedWeek);
        const year = this.selectedWeek.getFullYear();
        
        // Find the week menu for the current week
        this.currentWeekMenu = weekMenus.find(wm => wm.weekNumber === weekNumber && wm.year === year) || null;
        
        if (this.currentWeekMenu) {
          // Convert WeekDay data back to RecipeAssignments for display
          this.convertWeekDaysToRecipeAssignments();
        }
      },
      error: (error) => {
        console.error('Error loading week menus:', error);
      }
    });
  }

  private convertWeekDaysToRecipeAssignments(): void {
    if (!this.currentWeekMenu) return;
    
    this.recipeAssignments = [];
    const startOfWeek = this.getStartOfWeek(this.selectedWeek);
    
    this.currentWeekMenu.weekDays.forEach(weekDay => {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + weekDay.dayOfWeek - 1); // Adjust for Monday start
      const dateString = currentDate.toISOString().split('T')[0];
      
      if (weekDay.breakfastRecipeId) {
        this.recipeAssignments.push({
          date: dateString,
          mealType: 'breakfast',
          recipeId: weekDay.breakfastRecipeId,
          recipeTitle: 'Loading...' // We'd need to fetch recipe details for the full title
        });
      }
      
      if (weekDay.lunchRecipeId) {
        this.recipeAssignments.push({
          date: dateString,
          mealType: 'lunch',
          recipeId: weekDay.lunchRecipeId,
          recipeTitle: 'Loading...'
        });
      }
      
      if (weekDay.dinnerRecipeId) {
        this.recipeAssignments.push({
          date: dateString,
          mealType: 'dinner',
          recipeId: weekDay.dinnerRecipeId,
          recipeTitle: 'Loading...'
        });
      }
    });
  }

  private saveWeekMenuToApi(): void {
    if (this.isSaving) {
      return; // Prevent multiple simultaneous saves
    }

    this.isSaving = true;
    
    const weekNumber = this.getWeekNumber(this.selectedWeek);
    const year = this.selectedWeek.getFullYear();
    const weekDays = this.convertRecipeAssignmentsToWeekDays();

    const request: CreateOrUpdateWeekMenuRequest = {
      weekNumber,
      year,
      weekDays
    };

    this.weekMenuService.createOrUpdateWeekMenu(request).subscribe({
      next: (response) => {
        this.currentWeekMenu = {
          id: response.id,
          weekNumber: response.weekNumber,
          year: response.year,
          weekDays: response.weekDays
        };
        this.isSaving = false;
        console.log('Week menu saved successfully:', response);
      },
      error: (error) => {
        console.error('Error saving week menu:', error);
        this.isSaving = false;
        // You might want to show a user-friendly error message here
      }
    });
  }

  private getWeekNumber(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  }

  private convertRecipeAssignmentsToWeekDays(): WeekDay[] {
    const weekDays: WeekDay[] = [];
    
    // Create a map of assignments by date
    const assignmentsByDate = new Map<string, RecipeAssignment[]>();
    this.recipeAssignments.forEach(assignment => {
      if (!assignmentsByDate.has(assignment.date)) {
        assignmentsByDate.set(assignment.date, []);
      }
      assignmentsByDate.get(assignment.date)!.push(assignment);
    });

    // Get the start of the week (Monday)
    const startOfWeek = this.getStartOfWeek(this.selectedWeek);
    
    // Create WeekDay objects for each day of the week
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      
      const dayAssignments = assignmentsByDate.get(dateString) || [];
      
      const weekDay: WeekDay = {
        dayOfWeek: currentDate.getDay(),
        breakfastRecipeId: dayAssignments.find(a => a.mealType === 'breakfast')?.recipeId,
        lunchRecipeId: dayAssignments.find(a => a.mealType === 'lunch')?.recipeId,
        dinnerRecipeId: dayAssignments.find(a => a.mealType === 'dinner')?.recipeId
      };
      
      weekDays.push(weekDay);
    }
    
    return weekDays;
  }

  private getStartOfWeek(date: Date): Date {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }
}
