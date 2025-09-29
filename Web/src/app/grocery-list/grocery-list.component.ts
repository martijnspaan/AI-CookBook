import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PageTitleService } from '../services/page-title.service';
import { GroceryListService } from '../services/grocery-list.service';
import { RecipeService } from '../services/recipe.service';
import { WeekMenuService } from '../services/week-menu.service';
import { GroceryList, Meal } from '../models/grocery-list.model';
import { Recipe } from '../models/recipe.model';
import { WeekMenu } from '../models/week-menu.model';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EditGroceryListDialogComponent } from './edit-grocery-list-dialog/edit-grocery-list-dialog.component';

// Import the RecipeAssignment interface
interface RecipeAssignment {
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  recipeId: string;
  recipeTitle: string;
}

interface MealWithRecipe extends Meal {
  recipeTitle?: string;
}

interface GroceryListWithRecipes extends GroceryList {
  meals: MealWithRecipe[];
}

interface DayGroup {
  day: string;
  meals: MealWithRecipe[];
}

@Component({
  selector: 'app-grocery-list',
  standalone: true,
  imports: [CommonModule, EditGroceryListDialogComponent],
  templateUrl: './grocery-list.component.html',
  styleUrl: './grocery-list.component.scss'
})

export class GroceryListComponent implements OnInit, AfterViewInit {
  groceryLists: GroceryListWithRecipes[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;
  isDeleting: boolean = false;
  showEditDialog: boolean = false;
  selectedGroceryListForEdit: GroceryListWithRecipes | null = null;
  recipeAssignments: RecipeAssignment[] = [];

  constructor(
    private pageTitleService: PageTitleService,
    private groceryListService: GroceryListService,
    private recipeService: RecipeService,
    private weekMenuService: WeekMenuService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadGroceryLists();
    this.loadWeekMenus();
  }

  ngAfterViewInit(): void {
    this.pageTitleService.setPageTitle('Grocery Lists');
  }

  public loadGroceryLists(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.groceryListService.getAllGroceryLists().subscribe({
      next: (groceryLists) => {
        this.loadGroceryListsWithRecipes(groceryLists);
      },
      error: (error) => {
        console.error('Error loading grocery lists:', error);
        this.errorMessage = 'Failed to load grocery lists. Please try again.';
        this.isLoading = false;
      }
    });
  }

  private loadGroceryListsWithRecipes(groceryLists: GroceryList[]): Promise<void> {
    
    if (groceryLists.length === 0) {
      this.groceryLists = [];
      this.isLoading = false;
      return Promise.resolve();
    }

    // Collect all unique recipe IDs from all grocery lists
    const recipeIds = new Set<string>();
    groceryLists.forEach(groceryList => {
      groceryList.meals.forEach(meal => {
        if (meal.recipeId) {
          recipeIds.add(meal.recipeId);
        }
      });
    });


    if (recipeIds.size === 0) {
      this.groceryLists = groceryLists as GroceryListWithRecipes[];
      this.isLoading = false;
      return Promise.resolve();
    }

    // Fetch all recipes in parallel
    const recipeObservables = Array.from(recipeIds).map(id =>
      this.recipeService.getRecipeById(id).pipe(
        catchError((error) => {
          console.error(`Error fetching recipe ${id}:`, error);
          return of(null); // Return null for failed requests
        })
      )
    );

    return new Promise<void>((resolve, reject) => {
      forkJoin(recipeObservables).subscribe({
        next: (recipes) => {
          // Create a map of recipe ID to recipe title
          const recipeMap = new Map<string, string>();
          recipes.forEach(recipe => {
            if (recipe) {
              recipeMap.set(recipe.id, recipe.title);
            }
          });

          // Update grocery lists with recipe titles
          this.groceryLists = groceryLists.map(groceryList => ({
            ...groceryList,
            meals: groceryList.meals.map(meal => ({
              ...meal,
              recipeTitle: meal.recipeId ? recipeMap.get(meal.recipeId) : undefined
            }))
          }));

          this.isLoading = false;
          resolve();
        },
        error: (error) => {
          console.error('Error loading recipes:', error);
          // Still show grocery lists even if recipe loading fails
          this.groceryLists = groceryLists as GroceryListWithRecipes[];
          this.isLoading = false;
          resolve();
        }
      });
    });
  }

  private loadRecipesForSingleGroceryList(groceryList: GroceryList): Promise<GroceryListWithRecipes> {
    // Collect unique recipe IDs from the grocery list
    const recipeIds = new Set<string>();
    groceryList.meals.forEach(meal => {
      if (meal.recipeId) {
        recipeIds.add(meal.recipeId);
      }
    });

    if (recipeIds.size === 0) {
      return Promise.resolve(groceryList as GroceryListWithRecipes);
    }

    // Fetch all recipes in parallel
    const recipeObservables = Array.from(recipeIds).map(id =>
      this.recipeService.getRecipeById(id).pipe(
        catchError((error) => {
          console.error(`Error fetching recipe ${id}:`, error);
          return of(null); // Return null for failed requests
        })
      )
    );

    return new Promise<GroceryListWithRecipes>((resolve, reject) => {
      forkJoin(recipeObservables).subscribe({
        next: (recipes) => {
          // Create a map of recipe ID to recipe title
          const recipeMap = new Map<string, string>();
          recipes.forEach(recipe => {
            if (recipe) {
              recipeMap.set(recipe.id, recipe.title);
            }
          });

          // Update grocery list with recipe titles
          const groceryListWithRecipes: GroceryListWithRecipes = {
            ...groceryList,
            meals: groceryList.meals.map(meal => ({
              ...meal,
              recipeTitle: meal.recipeId ? recipeMap.get(meal.recipeId) : undefined
            }))
          };

          resolve(groceryListWithRecipes);
        },
        error: (error) => {
          console.error('Error loading recipes:', error);
          // Still return the grocery list even if recipe loading fails
          resolve(groceryList as GroceryListWithRecipes);
        }
      });
    });
  }

  getFormattedDate(dateString: string): string {
    let date: Date;
    
    // Handle ISO 8601 date strings properly to avoid timezone issues
    if (dateString.includes('T') && dateString.includes('Z')) {
      // If it's an ISO 8601 string with timezone, extract just the date part
      const datePart = dateString.split('T')[0]; // Get YYYY-MM-DD part
      const [year, month, day] = datePart.split('-').map(Number);
      date = new Date(year, month - 1, day); // month is 0-indexed
    } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // If it's already in YYYY-MM-DD format, parse it as local date
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day); // month is 0-indexed
    } else {
      // Otherwise, parse normally
      date = new Date(dateString);
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  }

  getMealTypeLabel(mealType: string): string {
    return mealType.charAt(0).toUpperCase() + mealType.slice(1);
  }

  getMealsGroupedByDay(meals: MealWithRecipe[]): DayGroup[] {
    const grouped = meals.reduce((groups, meal) => {
      // Handle date string properly to avoid timezone issues
      // If dayOfMeal is already a date string (YYYY-MM-DD), use it directly
      // Otherwise, parse it and extract just the date part
      let normalizedDate: string;
      
      if (typeof meal.dayOfMeal === 'string' && meal.dayOfMeal.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Already in YYYY-MM-DD format
        normalizedDate = meal.dayOfMeal;
      } else {
        // Parse the date and extract just the date part in YYYY-MM-DD format
        const mealDate = new Date(meal.dayOfMeal);
        const year = mealDate.getFullYear();
        const month = String(mealDate.getMonth() + 1).padStart(2, '0');
        const day = String(mealDate.getDate()).padStart(2, '0');
        normalizedDate = `${year}-${month}-${day}`;
      }
      
      if (!groups[normalizedDate]) {
        groups[normalizedDate] = [];
      }
      groups[normalizedDate].push(meal);
      return groups;
    }, {} as Record<string, MealWithRecipe[]>);

    return Object.keys(grouped)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map(day => ({
        day,
        meals: grouped[day]
      }));
  }

  getFormattedDayDate(dateString: string): string {
    // Handle date string properly to avoid timezone issues
    let date: Date;
    
    // Handle ISO 8601 date strings properly to avoid timezone issues
    if (dateString.includes('T') && dateString.includes('Z')) {
      // If it's an ISO 8601 string with timezone, extract just the date part
      const datePart = dateString.split('T')[0]; // Get YYYY-MM-DD part
      const [year, month, day] = datePart.split('-').map(Number);
      date = new Date(year, month - 1, day); // month is 0-indexed
    } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // If it's already in YYYY-MM-DD format, parse it as local date
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day); // month is 0-indexed
    } else {
      // Otherwise, parse normally
      date = new Date(dateString);
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  viewGroceryListDetails(groceryListId: string): void {
    this.router.navigate(['/grocery-list', groceryListId]);
  }

  deleteGroceryList(groceryListId: string): void {
    this.isDeleting = true;
    this.errorMessage = null;

    this.groceryListService.deleteGroceryList(groceryListId).subscribe({
      next: () => {
        this.isDeleting = false;
        
        // Reload the grocery lists
        this.loadGroceryLists();
      },
      error: (error) => {
        console.error('Error deleting grocery list:', error);
        this.errorMessage = 'Failed to delete grocery list. Please try again.';
        this.isDeleting = false;
      }
    });
  }

  editGroceryList(groceryList: GroceryListWithRecipes, event: Event): void {
    event.stopPropagation();
    this.selectedGroceryListForEdit = groceryList;
    this.showEditDialog = true;
  }

  onGroceryListUpdated(updatedGroceryList: GroceryList): void {
    // Find and update the grocery list in the array
    const index = this.groceryLists.findIndex(gl => gl.id === updatedGroceryList.id);
    if (index !== -1) {
      // Load recipes for just the updated grocery list
      this.loadRecipesForSingleGroceryList(updatedGroceryList).then((updatedWithRecipes) => {
        // Replace the specific item in the array
        this.groceryLists[index] = updatedWithRecipes;
      });
    }
    this.closeEditDialog();
  }

  closeEditDialog(): void {
    this.showEditDialog = false;
    this.selectedGroceryListForEdit = null;
  }

  private loadWeekMenus(): void {
    this.weekMenuService.getWeekMenus().subscribe({
      next: (weekMenus) => {
        this.convertWeekMenusToRecipeAssignments(weekMenus);
      },
      error: (error) => {
        console.error('Error loading week menus:', error);
        // Don't show error to user as this is not critical for grocery list functionality
      }
    });
  }

  private convertWeekMenusToRecipeAssignments(weekMenus: WeekMenu[]): void {
    this.recipeAssignments = [];
    
    // Collect all unique recipe IDs to fetch
    const recipeIdsToFetch = new Set<string>();
    
    weekMenus.forEach(weekMenu => {
      weekMenu.weekDays.forEach(weekDay => {
        if (weekDay.breakfastRecipeId) recipeIdsToFetch.add(weekDay.breakfastRecipeId);
        if (weekDay.lunchRecipeId) recipeIdsToFetch.add(weekDay.lunchRecipeId);
        if (weekDay.dinnerRecipeId) recipeIdsToFetch.add(weekDay.dinnerRecipeId);
      });
    });
    
    if (recipeIdsToFetch.size === 0) {
      return;
    }
    
    // Fetch all recipes in parallel
    const recipeObservables = Array.from(recipeIdsToFetch).map(id =>
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
        
        // Convert week menus to recipe assignments
        weekMenus.forEach(weekMenu => {
          const startOfWeek = this.getStartOfWeekFromWeekNumber(weekMenu.year, weekMenu.weekNumber);
          
          weekMenu.weekDays.forEach(weekDay => {
            const currentDate = new Date(startOfWeek);
            // API uses: 1=Monday, 2=Tuesday, ..., 6=Saturday, 0=Sunday
            // JavaScript uses: 0=Sunday, 1=Monday, ..., 6=Saturday
            let dayOffset = weekDay.dayOfWeek;
            if (weekDay.dayOfWeek === 0) {
              // Sunday in API (0) should be day 6 in JavaScript week (Sunday)
              dayOffset = 6;
            } else {
              // Monday (1) to Saturday (6) in API should be day 0 to 5 in JavaScript week
              dayOffset = weekDay.dayOfWeek - 1;
            }
            currentDate.setDate(startOfWeek.getDate() + dayOffset);
            
            const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
            
            // Add breakfast assignment
            if (weekDay.breakfastRecipeId) {
              this.recipeAssignments.push({
                date: dateString,
                mealType: 'breakfast',
                recipeId: weekDay.breakfastRecipeId,
                recipeTitle: recipeMap.get(weekDay.breakfastRecipeId) || 'Loading...'
              });
            }
            
            // Add lunch assignment
            if (weekDay.lunchRecipeId) {
              this.recipeAssignments.push({
                date: dateString,
                mealType: 'lunch',
                recipeId: weekDay.lunchRecipeId,
                recipeTitle: recipeMap.get(weekDay.lunchRecipeId) || 'Loading...'
              });
            }
            
            // Add dinner assignment
            if (weekDay.dinnerRecipeId) {
              this.recipeAssignments.push({
                date: dateString,
                mealType: 'dinner',
                recipeId: weekDay.dinnerRecipeId,
                recipeTitle: recipeMap.get(weekDay.dinnerRecipeId) || 'Loading...'
              });
            }
          });
        });
      },
      error: (error) => {
        console.error('Error loading recipes for week menus:', error);
      }
    });
  }

  private getStartOfWeek(date: Date): Date {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }

  private getStartOfWeekFromWeekNumber(year: number, weekNumber: number): Date {
    // Create a date for January 4th of the given year (always in week 1)
    const jan4 = new Date(year, 0, 4);
    const jan4Day = jan4.getDay();
    const jan4WeekStart = new Date(jan4);
    jan4WeekStart.setDate(jan4.getDate() - jan4Day + 1); // Monday of week 1
    
    // Calculate the start of the requested week
    const weekStart = new Date(jan4WeekStart);
    weekStart.setDate(jan4WeekStart.getDate() + (weekNumber - 1) * 7);
    weekStart.setHours(0, 0, 0, 0);
    
    return weekStart;
  }


  navigateToWeekMenu(): void {
    this.router.navigate(['/week-menu']);
  }

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'today';
    } else if (diffInDays === 1) {
      return 'yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    } else {
      const months = Math.floor(diffInDays / 30);
      return `${months} month${months !== 1 ? 's' : ''} ago`;
    }
  }

}
