import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { WeekCalendarComponent, RecipeAssignment } from './week-calendar/week-calendar.component';
import { RecipeSelectionDialogService } from '../services/recipe-selection-dialog.service';
import { GroceryListDialogComponent, MealSelection } from './grocery-list-dialog/grocery-list-dialog.component';
import { RecipeGridComponent } from './recipe-grid/recipe-grid.component';
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
  imports: [CommonModule, WeekCalendarComponent, GroceryListDialogComponent, RecipeGridComponent],
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
  isLoadingRecipes: boolean = false;
  errorMessage: string | null = null;
  currentRecipe: Recipe | null = null;
  private destroySubject = new Subject<void>();

  constructor(
    private pageTitleService: PageTitleService,
    private weekMenuService: WeekMenuService,
    private recipeService: RecipeService,
    private groceryListDialogService: GroceryListDialogService,
    private recipeSelectionDialogService: RecipeSelectionDialogService,
    private groceryListService: GroceryListService,
    private router: Router,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadWeekMenus();
    this.loadAllRecipes();
    this.subscribeToGroceryListDialog();
    this.subscribeToRecipeSelectionDialog();
    this.subscribeToTouchDropEvents();
  }

  ngAfterViewInit(): void {
    this.pageTitleService.setPageTitleFromTranslation('PAGE_TITLES.WEEK_MENU');
  }

  onWeekChanged(week: Date) {
    this.selectedWeek = week;
    this.loadWeekMenus();
  }

  onMealSlotClicked(mealType: 'breakfast' | 'lunch' | 'dinner', date: Date) {
    this.selectedMealSlot = { mealType, date };
    const currentRecipe = this.getCurrentRecipe(mealType, date);
    this.recipeSelectionDialogService.openDialog(mealType, date, currentRecipe);
  }

  onRecipeDropped(event: { recipe: Recipe; mealType: 'breakfast' | 'lunch' | 'dinner'; date: Date }) {
    const dateString = this.formatDateAsString(event.date);
    
    // Remove existing assignment for this meal slot
    this.recipeAssignments = this.recipeAssignments.filter(
      assignment => !(assignment.date === dateString && assignment.mealType === event.mealType)
    );
    
    // Add new assignment
    const newAssignment: RecipeAssignment = {
      date: dateString,
      mealType: event.mealType,
      recipeId: event.recipe.id,
      recipeTitle: event.recipe.title
    };
    
    this.recipeAssignments.push(newAssignment);
    
    // Save to API
    this.saveWeekMenuToApi();
  }


  getCurrentRecipe(mealType?: 'breakfast' | 'lunch' | 'dinner', date?: Date): Recipe | null {
    const targetMealType = mealType || this.selectedMealType;
    const targetDate = date || this.selectedDate;
    
    if (!targetDate || !targetMealType) return null;
    
    const dateString = this.formatDateAsString(targetDate);
    const assignment = this.recipeAssignments.find(
      assignment => assignment.date === dateString && assignment.mealType === targetMealType
    );
    
    if (!assignment) return null;
    
    // Find the recipe by ID
    return this.recipes.find(recipe => recipe.id === assignment.recipeId) || null;
  }

  onRecipeSelected(event: { recipe: Recipe; mealType: string }) {
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
      
      // Save to API
      this.saveWeekMenuToApi();
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
    this.isLoadingRecipes = true;
    this.errorMessage = null;
    
    this.recipeService.getAllRecipes().subscribe({
      next: (recipes) => {
        this.recipes = recipes;
        this.isLoadingRecipes = false;
      },
      error: (error) => {
        console.error('Error loading recipes:', error);
        this.errorMessage = 'Failed to load recipes. Please make sure the API is running.';
        this.isLoadingRecipes = false;
      }
    });
  }

  private loadWeekMenus(): void {
    this.isCalendarLoading = true;
    this.weekMenuService.getWeekMenus().subscribe({
      next: (weekMenus) => {
        
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
    const { startDate, endDate } = DateTimeUtil.getDateRange(DateTimeUtil.getCurrentDate(), 14);

    this.allWeekMenus.forEach(weekMenu => {
      this.processWeekMenuAssignments(weekMenu, startDate, endDate);
    });

    this.loadRecipeTitles();
  }

  private processWeekMenuAssignments(weekMenu: WeekMenu, startDate: Date, endDate: Date): void {
    weekMenu.weekDays.forEach(weekDay => {
      const dayDate = this.calculateDayDate(weekMenu, weekDay);
      
      if (DateTimeUtil.isDateInRange(dayDate, startDate, endDate)) {
        this.addRecipeAssignmentsForDay(weekDay, dayDate);
      }
    });
  }

  private calculateDayDate(weekMenu: WeekMenu, weekDay: WeekDay): Date {
    const weekStart = this.getStartOfWeekForWeekNumber(weekMenu.weekNumber, weekMenu.year);
    const dayDate = new Date(weekStart);
    const dayOffset = DateTimeUtil.convertApiDayOfWeekToJavaScript(weekDay.dayOfWeek);
    dayDate.setDate(weekStart.getDate() + dayOffset);
    return dayDate;
  }

  private addRecipeAssignmentsForDay(weekDay: WeekDay, dayDate: Date): void {
    const dateString = this.formatDateAsString(dayDate);
    
    if (weekDay.breakfastRecipeId) {
      this.recipeAssignments.push({
        date: dateString,
        mealType: 'breakfast',
        recipeId: weekDay.breakfastRecipeId,
        recipeTitle: 'Loading...'
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
  }

  private loadRecipeTitles(): void {
    if (this.recipeAssignments.length === 0) {
      return;
    }

    this.recipeService.getAllRecipes().subscribe({
      next: (recipes: Recipe[]) => {
        const recipeTitleMap = new Map<string, string>();
        recipes.forEach(recipe => recipeTitleMap.set(recipe.id, recipe.title));
        
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

  private getStartOfWeekForWeekNumber(weekNumber: number, year: number): Date {
    return DateTimeUtil.getStartOfWeekForWeekNumber(weekNumber, year);
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


    this.weekMenuService.createOrUpdateWeekMenu(request).subscribe({
      next: (response) => {
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
    return DateTimeUtil.getWeekNumber(date);
  }

  private convertRecipeAssignmentsToWeekDays(): WeekDay[] {
    const assignmentsByDate = this.createAssignmentsByDateMap();
    const targetWeek = this.determineTargetWeek();
    const startOfWeek = this.getStartOfWeek(targetWeek);
    
    return this.createWeekDaysFromAssignments(assignmentsByDate, startOfWeek);
  }

  private createAssignmentsByDateMap(): Map<string, RecipeAssignment[]> {
    const assignmentsByDate = new Map<string, RecipeAssignment[]>();
    this.recipeAssignments.forEach(assignment => {
      if (!assignmentsByDate.has(assignment.date)) {
        assignmentsByDate.set(assignment.date, []);
      }
      assignmentsByDate.get(assignment.date)!.push(assignment);
    });
    return assignmentsByDate;
  }

  private determineTargetWeek(): Date {
    if (this.recipeAssignments.length === 0) {
      return this.selectedWeek;
    }

    const selectedWeekStart = this.getStartOfWeek(this.selectedWeek);
    const selectedWeekEnd = new Date(selectedWeekStart);
    selectedWeekEnd.setDate(selectedWeekStart.getDate() + 6);
    
    const hasAssignmentsOutsideWeek = this.recipeAssignments.some(assignment => {
      const assignmentDate = new Date(assignment.date);
      return assignmentDate < selectedWeekStart || assignmentDate > selectedWeekEnd;
    });
    
    if (hasAssignmentsOutsideWeek) {
      // Use the week that contains the most recently added assignment
      const mostRecentAssignment = this.recipeAssignments[this.recipeAssignments.length - 1];
      return new Date(mostRecentAssignment.date);
    }
    
    return this.selectedWeek;
  }

  private createWeekDaysFromAssignments(assignmentsByDate: Map<string, RecipeAssignment[]>, startOfWeek: Date): WeekDay[] {
    const weekDays: WeekDay[] = [];
    
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
      
      weekDays.push(weekDay);
    }
    
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
        this.currentRecipe = config.currentRecipe;
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
    
    // Remove touch drop event listener
    document.removeEventListener('touchRecipeDropped', this.handleTouchDrop);
  }

  private subscribeToTouchDropEvents(): void {
    // Bind the handler to maintain 'this' context
    this.handleTouchDrop = this.handleTouchDrop.bind(this);
    document.addEventListener('touchRecipeDropped', this.handleTouchDrop as EventListener);
  }

  private handleTouchDrop = (event: Event): void => {
    const customEvent = event as CustomEvent;
    const { recipe, mealType, date } = customEvent.detail;
    
    // Use the same logic as the regular drop
    this.onRecipeDropped({
      recipe: recipe,
      mealType: mealType,
      date: date
    });
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
