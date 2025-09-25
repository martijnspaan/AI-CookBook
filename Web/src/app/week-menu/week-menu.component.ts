import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WeekCalendarComponent, RecipeAssignment } from './week-calendar/week-calendar.component';
import { RecipeSelectionDialogComponent } from './recipe-selection-dialog/recipe-selection-dialog.component';
import { GroceryShoppingDialogComponent, MealSelection } from './grocery-shopping-dialog/grocery-shopping-dialog.component';
import { Recipe } from '../models/recipe.model';
import { PageTitleService } from '../services/page-title.service';
import { WeekMenuService } from '../services/week-menu.service';
import { RecipeService } from '../services/recipe.service';
import { GroceryShoppingDialogService } from '../services/grocery-shopping-dialog.service';
import { GroceryListService } from '../services/grocery-list.service';
import { WeekMenu, WeekDay, CreateOrUpdateWeekMenuRequest } from '../models/week-menu.model';
import { forkJoin, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-week-menu',
  standalone: true,
  imports: [CommonModule, WeekCalendarComponent, RecipeSelectionDialogComponent, GroceryShoppingDialogComponent],
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
  showRecipeDialog: boolean = false;
  showGroceryShoppingDialog: boolean = false;
  currentWeekMenu: WeekMenu | null = null;
  isSaving: boolean = false;
  isCalendarLoading: boolean = true;
  private destroySubject = new Subject<void>();

  constructor(
    private pageTitleService: PageTitleService,
    private weekMenuService: WeekMenuService,
    private recipeService: RecipeService,
    private groceryShoppingDialogService: GroceryShoppingDialogService,
    private groceryListService: GroceryListService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadWeekMenus();
    this.loadAllRecipes();
    this.subscribeToGroceryShoppingDialog();
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

  getCurrentRecipe(): Recipe | null {
    if (!this.selectedDate || !this.selectedMealType) return null;
    
    const dateString = this.selectedDate.toISOString().split('T')[0];
    const assignment = this.recipeAssignments.find(
      assignment => assignment.date === dateString && assignment.mealType === this.selectedMealType
    );
    
    if (!assignment) return null;
    
    // Find the recipe by ID
    return this.recipes.find(recipe => recipe.id === assignment.recipeId) || null;
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

  onRecipeRemoved(event: { mealType: string; date: Date }): void {
    const dateString = event.date.toISOString().split('T')[0];
    
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
    this.showRecipeDialog = false;
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
        const weekNumber = this.getWeekNumber(this.selectedWeek);
        const year = this.selectedWeek.getFullYear();
        
        // Find the week menu for the current week
        this.currentWeekMenu = weekMenus.find(wm => wm.weekNumber === weekNumber && wm.year === year) || null;
        
        if (this.currentWeekMenu) {
          // Convert WeekDay data back to RecipeAssignments for display
          this.convertWeekDaysToRecipeAssignments();
        } else {
          // No week menu found, calendar is ready to show empty state
          this.isCalendarLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading week menus:', error);
        this.isCalendarLoading = false;
      }
    });
  }

  private convertWeekDaysToRecipeAssignments(): void {
    if (!this.currentWeekMenu) {
      console.log('No current week menu found');
      return;
    }
    
    console.log('=== DEBUG: convertWeekDaysToRecipeAssignments ===');
    console.log('Current week menu:', this.currentWeekMenu);
    console.log('Selected week:', this.selectedWeek);
    
    this.recipeAssignments = [];
    const startOfWeek = this.getStartOfWeek(this.selectedWeek);
    console.log('Start of week:', startOfWeek);
    
    // Collect all unique recipe IDs to fetch
    const recipeIdsToFetch = new Set<string>();
    
    this.currentWeekMenu.weekDays.forEach(weekDay => {
      if (weekDay.breakfastRecipeId) recipeIdsToFetch.add(weekDay.breakfastRecipeId);
      if (weekDay.lunchRecipeId) recipeIdsToFetch.add(weekDay.lunchRecipeId);
      if (weekDay.dinnerRecipeId) recipeIdsToFetch.add(weekDay.dinnerRecipeId);
    });
    
    console.log('Recipe IDs to fetch:', Array.from(recipeIdsToFetch));
    
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
      const dateString = currentDate.toISOString().split('T')[0];
      
      console.log(`Processing dayOfWeek: ${weekDay.dayOfWeek}, dayOffset: ${dayOffset}, calculated date: ${dateString}`);
      
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
    
    console.log('Created assignments:', assignments);
    
    // Fetch recipe details and update titles before showing calendar
    if (recipeIdsToFetch.size > 0) {
      console.log('Calling fetchRecipeTitlesAndUpdateAssignments with:', Array.from(recipeIdsToFetch));
      this.fetchRecipeTitlesAndUpdateAssignments(Array.from(recipeIdsToFetch), assignments);
    } else {
      console.log('No recipe IDs to fetch');
      this.recipeAssignments = assignments;
      this.isCalendarLoading = false;
    }
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

  private fetchRecipeTitlesAndUpdateAssignments(recipeIds: string[], assignments: RecipeAssignment[]): void {
    console.log('=== DEBUG: fetchRecipeTitlesAndUpdateAssignments ===');
    console.log('Fetching recipe details for IDs:', recipeIds);
    
    // Create observables for each recipe fetch
    const recipeObservables: Observable<Recipe>[] = recipeIds.map(id => 
      this.recipeService.getRecipeById(id)
    );
    
    // Fetch all recipes in parallel
    forkJoin(recipeObservables).subscribe({
      next: (recipes) => {
        console.log('Successfully fetched recipes:', recipes);
        
        // Create a map of recipe ID to recipe title for quick lookup
        const recipeTitleMap = new Map<string, string>();
        recipes.forEach(recipe => {
          recipeTitleMap.set(recipe.id, recipe.title);
        });
        
        console.log('Recipe title map:', recipeTitleMap);
        console.log('Before update - assignments:', assignments);
        
        // Update the recipe assignments with actual titles
        const updatedAssignments = assignments.map(assignment => ({
          ...assignment,
          recipeTitle: recipeTitleMap.get(assignment.recipeId) || 'Recipe not found'
        }));
        
        console.log('After update - assignments:', updatedAssignments);
        
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

  private subscribeToGroceryShoppingDialog(): void {
    this.groceryShoppingDialogService.dialogState$
      .pipe(takeUntil(this.destroySubject))
      .subscribe(config => {
        this.showGroceryShoppingDialog = config.isVisible;
      });
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  onGroceryShoppingListCreated(event: { selectedDay: Date; selectedMeals: MealSelection[] }): void {
    console.log('Grocery shopping list created:', event);
    
    // Convert MealSelection to Meal format for the API
    const meals = event.selectedMeals.map(meal => {
      return {
        dayOfMeal: this.getDayOfWeekFromDate(meal.date),
        mealType: meal.mealType,
        recipeId: meal.recipeId
      };
    });

    const groceryListRequest = {
      dayOfShopping: event.selectedDay.toISOString(),
      meals: meals
    };

    console.log('Sending grocery list request:', groceryListRequest);

    this.groceryListService.createGroceryList(groceryListRequest).subscribe({
      next: (groceryList) => {
        console.log('Grocery list created successfully:', groceryList);
        alert('Grocery list created successfully!');
        this.groceryShoppingDialogService.closeGroceryShoppingDialog();
        this.router.navigate(['/grocery-list']);
      },
      error: (error) => {
        console.error('Error creating grocery list:', error);
        alert('Error creating grocery list. Please try again.');
      }
    });
  }

  private getDayOfWeekFromDate(dateString: string): string {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  onGroceryShoppingDialogClosed(): void {
    this.groceryShoppingDialogService.closeGroceryShoppingDialog();
  }
}
