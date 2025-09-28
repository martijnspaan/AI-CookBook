import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PageTitleService } from '../services/page-title.service';
import { GroceryListService } from '../services/grocery-list.service';
import { RecipeService } from '../services/recipe.service';
import { GroceryList, Meal } from '../models/grocery-list.model';
import { Recipe } from '../models/recipe.model';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
  imports: [CommonModule],
  templateUrl: './grocery-list.component.html',
  styleUrl: './grocery-list.component.scss'
})

export class GroceryListComponent implements OnInit, AfterViewInit {
  groceryLists: GroceryListWithRecipes[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;
  isDeleting: boolean = false;

  constructor(
    private pageTitleService: PageTitleService,
    private groceryListService: GroceryListService,
    private recipeService: RecipeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadGroceryLists();
  }

  ngAfterViewInit(): void {
    this.pageTitleService.setPageTitle('Grocery List');
  }

  private loadGroceryLists(): void {
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

  private loadGroceryListsWithRecipes(groceryLists: GroceryList[]): void {
    
    if (groceryLists.length === 0) {
      this.groceryLists = [];
      this.isLoading = false;
      return;
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
      return;
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
      },
      error: (error) => {
        console.error('Error loading recipes:', error);
        // Still show grocery lists even if recipe loading fails
        this.groceryLists = groceryLists as GroceryListWithRecipes[];
        this.isLoading = false;
      }
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
      year: 'numeric',
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

}
