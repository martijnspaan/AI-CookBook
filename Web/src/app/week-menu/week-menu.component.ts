import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WeekCalendarComponent, RecipeAssignment } from './week-calendar/week-calendar.component';
import { RecipeSelectionDialogService } from '../services/recipe-selection-dialog.service';
import { RecipeSelectionDialogComponent } from './recipe-selection-dialog/recipe-selection-dialog.component';
import { GroceryListDialogComponent, MealSelection } from './grocery-list-dialog/grocery-list-dialog.component';
import { Recipe } from '../models/recipe.model';
import { PageTitleService } from '../services/page-title.service';
import { WeekMenuService } from '../services/week-menu.service';
import { RecipeService } from '../services/recipe.service';
import { GroceryListDialogService } from '../services/grocery-list-dialog.service';
import { GroceryListService } from '../services/grocery-list.service';
import { WeekMenu, WeekDay, CreateOrUpdateWeekMenuRequest } from '../models/week-menu.model';
import { forkJoin, Observable, Subject } from 'rxjs';
import { DateTimeUtil } from '../utils/date-time.util';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-week-menu',
  standalone: true,
  imports: [CommonModule, WeekCalendarComponent, RecipeSelectionDialogComponent, GroceryListDialogComponent],
  templateUrl: './week-menu.component.html',
  styleUrl: './week-menu.component.scss'
})
export class WeekMenuComponent implements OnInit, AfterViewInit, OnDestroy {
  selectedWeek: Date = new Date();
  selectedMealType: 'breakfast' | 'lunch' | 'dinner' | null = null;
  selectedDate: Date | null = null;
  selectedMealSlot: { mealType: 'breakfast' | 'lunch' | 'dinner'; date: Date } | null = null;
  recipeAssignments: RecipeAssignment[] = [];
  recipes: Recipe[] = [];
  showRecipeSelectionDialog: boolean = false;
  showGroceryListDialog: boolean = false;
  currentWeekMenu: WeekMenu | null = null;
  allWeekMenus: WeekMenu[] = [];
  isSaving: boolean = false;
  isCalendarLoading: boolean = true;
  private destroySubject = new Subject<void>();

  constructor(
    private pageTitleService: PageTitleService,
    private weekMenuService: WeekMenuService,
    private recipeService: RecipeService,
    private groceryListDialogService: GroceryListDialogService,
    private recipeSelectionDialogService: RecipeSelectionDialogService,
    private groceryListService: GroceryListService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadWeekMenus();
    this.loadAllRecipes();
    this.subscribeToGroceryListDialog();
    this.subscribeToRecipeSelectionDialog();
  }

  ngAfterViewInit(): void {
    this.pageTitleService.setPageTitle('Create Week Menu');
  }

  onWeekChanged(week: Date) {
    this.selectedWeek = week;
    this.loadWeekMenus();
  }

  onMealSlotClicked(mealType: 'breakfast' | 'lunch' | 'dinner', date: Date) {
    this.selectedMealSlot = { mealType, date };
    const currentRecipe = this.getCurrentRecipe();
    this.recipeSelectionDialogService.openDialog(mealType, date, currentRecipe);
  }

  getCurrentRecipe(): Recipe | null {
    if (!this.selectedDate || !this.selectedMealType) return null;
    
    const dateString = this.formatDateAsString(this.selectedDate);
    const assignment = this.recipeAssignments.find(
      assignment => assignment.date === dateString && assignment.mealType === this.selectedMealType
    );
    
    if (!assignment) return null;
    
    // Find the recipe by ID
    return this.recipes.find(recipe => recipe.id === assignment.recipeId) || null;
  }

  onRecipeSelected(event: { recipe: Recipe; mealType: string }) {
    console.log('onRecipeSelected called:', { event, selectedDate: this.selectedDate, selectedMealType: this.selectedMealType });
    
    if (this.selectedDate) {
      const dateString = this.formatDateAsString(this.selectedDate);
      
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
      console.log('Added recipe assignment:', newAssignment);
      console.log('Current recipeAssignments:', this.recipeAssignments);
      
      // Save to API
      this.saveWeekMenuToApi();
    } else {
      console.log('No selectedDate, skipping recipe assignment');
    }
    
    this.resetSelection();
  }

  onRecipeRemoved(event: { mealType: string; date: Date }): void {
    const dateString = this.formatDateAsString(event.date);
    
    // Remove the assignment for this meal slot
    this.recipeAssignments = this.recipeAssignments.filter(
      assignment => !(assignment.date === dateString && assignment.mealType === event.mealType)
    );
    
    // Save to API
    this.saveWeekMenuToApi();
    
    this.resetSelection();
  }

  onDialogClosed(): void {
    this.resetSelection();
  }

  private resetSelection(): void {
    this.selectedMealType = null;
    this.selectedDate = null;
    this.selectedMealSlot = null;
  }

  private loadAllRecipes(): void {
    this.recipeService.getAllRecipes().subscribe({
      next: (recipes) => {
        this.recipes = recipes;
      },
      error: (error) => {
        console.error('Error loading recipes:', error);
      }
    });
  }

  private loadWeekMenus(): void {
    this.isCalendarLoading = true;
    this.weekMenuService.getWeekMenus().subscribe({
      next: (weekMenus) => {
        console.log('Loading all week menus:', weekMenus);
        
        // Load ALL week menus and convert them to recipe assignments
        this.allWeekMenus = weekMenus;
        this.convertAllWeekMenusToRecipeAssignments();
        
        this.isCalendarLoading = false;
      },
      error: (error) => {
        console.error('Error loading week menus:', error);
        this.isCalendarLoading = false;
      }
    });
  }

  private convertWeekDaysToRecipeAssignments(): void {
    if (!this.currentWeekMenu) {
      return;
    }
    
    this.recipeAssignments = [];
    const startOfWeek = this.getStartOfWeek(this.selectedWeek);
    
    // Collect all unique recipe IDs to fetch
    const recipeIdsToFetch = new Set<string>();
    
    this.currentWeekMenu.weekDays.forEach(weekDay => {
      if (weekDay.breakfastRecipeId) recipeIdsToFetch.add(weekDay.breakfastRecipeId);
      if (weekDay.lunchRecipeId) recipeIdsToFetch.add(weekDay.lunchRecipeId);
      if (weekDay.dinnerRecipeId) recipeIdsToFetch.add(weekDay.dinnerRecipeId);
    });
    
    
    // Create assignments with actual recipe titles (no loading state)
    const assignments: RecipeAssignment[] = [];
    
    this.currentWeekMenu.weekDays.forEach(weekDay => {
      const currentDate = new Date(startOfWeek);
      // API uses: 1=Monday, 2=Tuesday, ..., 6=Saturday, 0=Sunday
      // JavaScript uses: 0=Sunday, 1=Monday, ..., 6=Saturday
      let dayOffset = weekDay.dayOfWeek;
      if (weekDay.dayOfWeek === 0) {
        // Sunday in API (0) should be day 6 in JavaScript week (Sunday)
        dayOffset = 6;
      } else {
        // Monday-Saturday in API (1-6) should be Monday-Saturday in JavaScript (1-6)
        dayOffset = weekDay.dayOfWeek - 1;
      }
      
      currentDate.setDate(startOfWeek.getDate() + dayOffset);
      const dateString = this.formatDateAsString(currentDate);
      
      
      if (weekDay.breakfastRecipeId) {
        assignments.push({
          date: dateString,
          mealType: 'breakfast',
          recipeId: weekDay.breakfastRecipeId,
          recipeTitle: 'Loading...'
        });
      }
      
      if (weekDay.lunchRecipeId) {
        assignments.push({
          date: dateString,
          mealType: 'lunch',
          recipeId: weekDay.lunchRecipeId,
          recipeTitle: 'Loading...'
        });
      }
      
      if (weekDay.dinnerRecipeId) {
        assignments.push({
          date: dateString,
          mealType: 'dinner',
          recipeId: weekDay.dinnerRecipeId,
          recipeTitle: 'Loading...'
        });
      }
    });
    
    // Fetch recipe details and update titles before showing calendar
    if (recipeIdsToFetch.size > 0) {
      this.fetchRecipeTitlesAndUpdateAssignments(Array.from(recipeIdsToFetch), assignments);
    } else {
      this.recipeAssignments = assignments;
      this.isCalendarLoading = false;
    }
  }

  private convertAllWeekMenusToRecipeAssignments(): void {
    this.recipeAssignments = [];

    // Get the 14-day range starting from today
    const today = DateTimeUtil.getCurrentDate();
    const { endDate } = DateTimeUtil.getDateRange(today, 14);

    console.log('Converting all week menus to recipe assignments for 14-day range:', {
      startDate: today,
      endDate: endDate,
      allWeekMenus: this.allWeekMenus
    });

    this.allWeekMenus.forEach(weekMenu => {
      weekMenu.weekDays.forEach(weekDay => {
        // Calculate the actual date for this week day
        const weekStart = this.getStartOfWeekForWeekNumber(weekMenu.weekNumber, weekMenu.year);
        const dayDate = new Date(weekStart);
        
        // Convert API day of week to JavaScript day offset
        const dayOffset = DateTimeUtil.convertApiDayOfWeekToJavaScript(weekDay.dayOfWeek);
        
        dayDate.setDate(weekStart.getDate() + dayOffset);

        // Only include assignments within our 14-day range
        const isInRange = DateTimeUtil.isDateInRange(dayDate, today, endDate);
        
        console.log('Date range check:', {
          dayDate: dayDate.toISOString(),
          today: today.toISOString(),
          endDate: endDate.toISOString(),
          isInRange
        });
        
        if (isInRange) {
          if (weekDay.breakfastRecipeId) {
            this.recipeAssignments.push({
              date: this.formatDateAsString(dayDate),
              mealType: 'breakfast',
              recipeId: weekDay.breakfastRecipeId,
              recipeTitle: 'Loading...'
            });
          }

          if (weekDay.lunchRecipeId) {
            this.recipeAssignments.push({
              date: this.formatDateAsString(dayDate),
              mealType: 'lunch',
              recipeId: weekDay.lunchRecipeId,
              recipeTitle: 'Loading...'
            });
          }

          if (weekDay.dinnerRecipeId) {
            this.recipeAssignments.push({
              date: this.formatDateAsString(dayDate),
              mealType: 'dinner',
              recipeId: weekDay.dinnerRecipeId,
              recipeTitle: 'Loading...'
            });
          }
        }
      });
    });

    console.log('Final recipe assignments:', this.recipeAssignments);
    
    // Fetch recipe titles for all assignments
    if (this.recipeAssignments.length > 0) {
      this.recipeService.getAllRecipes().subscribe({
        next: (recipes: Recipe[]) => {
          const recipeTitleMap = new Map<string, string>();
          recipes.forEach((recipe: Recipe) => {
            recipeTitleMap.set(recipe.id, recipe.title);
          });
          
          this.recipeAssignments = this.recipeAssignments.map(assignment => ({
            ...assignment,
            recipeTitle: recipeTitleMap.get(assignment.recipeId) || 'Recipe not found'
          }));
        },
        error: (error: any) => {
          console.error('Error loading recipes for assignments:', error);
          this.recipeAssignments = this.recipeAssignments.map(assignment => ({
            ...assignment,
            recipeTitle: 'Error loading recipe'
          }));
        }
      });
    }
  }

  private getStartOfWeekForWeekNumber(weekNumber: number, year: number): Date {
    const weekStart = DateTimeUtil.getStartOfWeekForWeekNumber(weekNumber, year);
    
    console.log('Calculating week start (using known data points):', {
      year,
      weekNumber,
      weekStart: weekStart.toISOString(),
      weekStartLocal: weekStart.toLocaleDateString()
    });
    
    return weekStart;
  }

  private saveWeekMenuToApi(): void {
    if (this.isSaving) {
      return; // Prevent multiple simultaneous saves
    }

    this.isSaving = true;
    
    const weekDays = this.convertRecipeAssignmentsToWeekDays();
    
    // Calculate week number and year based on the actual week being saved
    // We need to determine which week the assignments belong to
    let targetWeekForCalculation = this.selectedWeek;
    if (this.recipeAssignments.length > 0) {
      // Use the last added assignment (by array position) to determine the week
      const lastAddedAssignment = this.recipeAssignments[this.recipeAssignments.length - 1];
      targetWeekForCalculation = new Date(lastAddedAssignment.date);
    }
    
    const weekNumber = this.getWeekNumber(targetWeekForCalculation);
    const year = targetWeekForCalculation.getFullYear();

    const request: CreateOrUpdateWeekMenuRequest = {
      weekNumber,
      year,
      weekDays
    };

    console.log('Saving week menu to API:', { 
      request, 
      recipeAssignments: this.recipeAssignments,
      targetWeekForCalculation: targetWeekForCalculation,
      weekNumber: weekNumber,
      year: year,
      selectedWeek: this.selectedWeek,
      weekDays: weekDays
    });
    
    // Log each weekDay to see if Monday has the recipe
    weekDays.forEach((weekDay, index) => {
      console.log(`WeekDay ${index}:`, {
        dayOfWeek: weekDay.dayOfWeek,
        breakfastRecipeId: weekDay.breakfastRecipeId,
        lunchRecipeId: weekDay.lunchRecipeId,
        dinnerRecipeId: weekDay.dinnerRecipeId
      });
    });

    this.weekMenuService.createOrUpdateWeekMenu(request).subscribe({
      next: (response) => {
        console.log('Week menu saved successfully:', response);
        this.currentWeekMenu = {
          id: response.id,
          weekNumber: response.weekNumber,
          year: response.year,
          weekDays: response.weekDays
        };
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error saving week menu:', error);
        this.isSaving = false;
        // You might want to show a user-friendly error message here
      }
    });
  }

  private getWeekNumber(date: Date): number {
    const weekNumber = DateTimeUtil.getWeekNumber(date);
    
    console.log('Calculating week number:', {
      date: date.toISOString(),
      weekNumber
    });
    
    return weekNumber;
  }

  private convertRecipeAssignmentsToWeekDays(): WeekDay[] {
    const weekDays: WeekDay[] = [];
    
    console.log('Converting recipe assignments to week days:', this.recipeAssignments);
    console.log('Selected week:', this.selectedWeek);
    
    // Create a map of assignments by date
    const assignmentsByDate = new Map<string, RecipeAssignment[]>();
    this.recipeAssignments.forEach(assignment => {
      if (!assignmentsByDate.has(assignment.date)) {
        assignmentsByDate.set(assignment.date, []);
      }
      assignmentsByDate.get(assignment.date)!.push(assignment);
    });

    console.log('Assignments by date:', Object.fromEntries(assignmentsByDate));

    // Determine which week to use for the conversion
    // Use the selected week as the base, but ensure we include all assignments
    let targetWeek = this.selectedWeek;
    
    // If we have assignments, check if any are outside the current week
    if (this.recipeAssignments.length > 0) {
      const selectedWeekStart = this.getStartOfWeek(this.selectedWeek);
      const selectedWeekEnd = new Date(selectedWeekStart);
      selectedWeekEnd.setDate(selectedWeekStart.getDate() + 6);
      
      console.log('Selected week range:', { 
        start: selectedWeekStart, 
        end: selectedWeekEnd,
        selectedWeek: this.selectedWeek 
      });
      
      // Check if any assignments are outside the selected week
      const hasAssignmentsOutsideWeek = this.recipeAssignments.some(assignment => {
        const assignmentDate = new Date(assignment.date);
        const isOutside = assignmentDate < selectedWeekStart || assignmentDate > selectedWeekEnd;
        console.log(`Assignment ${assignment.date} outside week:`, { 
          assignmentDate, 
          selectedWeekStart, 
          selectedWeekEnd, 
          isOutside 
        });
        return isOutside;
      });
      
      console.log('Has assignments outside week:', hasAssignmentsOutsideWeek);
      
          if (hasAssignmentsOutsideWeek) {
            // Use the week that contains the most recent assignment
            // But prioritize the assignment that was just added (the last one in the array)
            const mostRecentAssignment = this.recipeAssignments[this.recipeAssignments.length - 1];
            targetWeek = new Date(mostRecentAssignment.date);
            console.log('Switching to most recent assignment week (using last added):', { mostRecentAssignment, targetWeek });
          }
    }

        // Get the start of the week (Monday) for the target week
        const startOfWeek = this.getStartOfWeek(targetWeek);
        console.log('Target week:', targetWeek);
        console.log('Start of week:', startOfWeek);
        
        // Verify that the target week calculation is correct
        console.log('Week calculation verification:', {
          targetWeek,
          startOfWeek,
          targetWeekDayOfWeek: targetWeek.getDay(),
          expectedMonday: startOfWeek.getDay() === 1 ? 'Correct' : 'Wrong'
        });
    
    // Create WeekDay objects for each day of the week
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      const dateString = this.formatDateAsString(currentDate);
      
      const dayAssignments = assignmentsByDate.get(dateString) || [];
      
      const weekDay: WeekDay = {
        dayOfWeek: DateTimeUtil.getApiDayOfWeek(currentDate),
        breakfastRecipeId: dayAssignments.find(a => a.mealType === 'breakfast')?.recipeId,
        lunchRecipeId: dayAssignments.find(a => a.mealType === 'lunch')?.recipeId,
        dinnerRecipeId: dayAssignments.find(a => a.mealType === 'dinner')?.recipeId
      };
      
      console.log(`Day ${i} (${dateString}):`, { currentDate, dayAssignments, weekDay });
      weekDays.push(weekDay);
    }
    
    console.log('Final weekDays:', weekDays);
    return weekDays;
  }

  private getStartOfWeek(date: Date): Date {
    return DateTimeUtil.getStartOfWeek(date);
  }

  private formatDateAsString(date: Date): string {
    return DateTimeUtil.formatDateAsString(date);
  }

  private fetchRecipeTitlesAndUpdateAssignments(recipeIds: string[], assignments: RecipeAssignment[]): void {
    
    // Create observables for each recipe fetch
    const recipeObservables: Observable<Recipe>[] = recipeIds.map(id => 
      this.recipeService.getRecipeById(id)
    );
    
    // Fetch all recipes in parallel
    forkJoin(recipeObservables).subscribe({
      next: (recipes) => {
        // Create a map of recipe ID to recipe title for quick lookup
        const recipeTitleMap = new Map<string, string>();
        recipes.forEach(recipe => {
          recipeTitleMap.set(recipe.id, recipe.title);
        });
        
        // Update the recipe assignments with actual titles
        const updatedAssignments = assignments.map(assignment => ({
          ...assignment,
          recipeTitle: recipeTitleMap.get(assignment.recipeId) || 'Recipe not found'
        }));
        
        // Set the final assignments and mark calendar as ready
        this.recipeAssignments = updatedAssignments;
        this.isCalendarLoading = false;
      },
      error: (error) => {
        console.error('Error fetching recipe details:', error);
        // Update assignments to show error state
        const errorAssignments = assignments.map(assignment => ({
          ...assignment,
          recipeTitle: 'Error loading recipe'
        }));
        
        this.recipeAssignments = errorAssignments;
        this.isCalendarLoading = false;
      }
    });
  }

  private subscribeToGroceryListDialog(): void {
    this.groceryListDialogService.dialogState$
      .pipe(takeUntil(this.destroySubject))
      .subscribe(config => {
        this.showGroceryListDialog = config.isVisible;
      });
  }

  private subscribeToRecipeSelectionDialog(): void {
    this.recipeSelectionDialogService.dialogState$
      .pipe(takeUntil(this.destroySubject))
      .subscribe(config => {
        this.showRecipeSelectionDialog = config.isVisible;
        this.selectedMealType = config.selectedMealType;
        this.selectedDate = config.selectedDate;
      });

    this.recipeSelectionDialogService.recipeSelected$
      .pipe(takeUntil(this.destroySubject))
      .subscribe(event => {
        this.onRecipeSelected(event);
      });

    this.recipeSelectionDialogService.recipeRemoved$
      .pipe(takeUntil(this.destroySubject))
      .subscribe(event => {
        this.onRecipeRemoved(event);
      });

    this.recipeSelectionDialogService.dialogClosed$
      .pipe(takeUntil(this.destroySubject))
      .subscribe(() => {
        this.onDialogClosed();
      });
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  onGroceryListCreated(event: { selectedDay: Date; selectedMeals: MealSelection[] }): void {
    
    // Convert MealSelection to Meal format for the API
    const meals = event.selectedMeals.map(meal => {
      return {
        dayOfMeal: meal.date, // Store the actual date instead of just day name
        mealType: meal.mealType,
        recipeId: meal.recipeId
      };
    });

    const groceryListRequest = {
      dayOfGrocery: event.selectedDay.toISOString(),
      meals: meals
    };


    this.groceryListService.createGroceryList(groceryListRequest).subscribe({
      next: (groceryList) => {
        this.groceryListDialogService.closeGroceryListDialog();
        this.router.navigate(['/grocery-list']);
      },
      error: (error) => {
        console.error('Error creating grocery list:', error);
      }
    });
  }

  private getDayOfWeekFromDate(dateString: string): string {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  onGroceryListDialogClosed(): void {
    this.groceryListDialogService.closeGroceryListDialog();
  }
}
