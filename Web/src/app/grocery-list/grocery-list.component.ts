import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  constructor(
    private pageTitleService: PageTitleService,
    private groceryListService: GroceryListService,
    private recipeService: RecipeService
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
    console.log('Loading grocery lists...');

    this.groceryListService.getAllGroceryLists().subscribe({
      next: (groceryLists) => {
        console.log('Grocery lists loaded:', groceryLists);
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
    console.log('Processing grocery lists with recipes:', groceryLists);
    
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

    console.log('Recipe IDs found:', Array.from(recipeIds));

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

    console.log('Fetching recipes...');
    forkJoin(recipeObservables).subscribe({
      next: (recipes) => {
        console.log('Recipes fetched:', recipes);
        
        // Create a map of recipe ID to recipe title
        const recipeMap = new Map<string, string>();
        recipes.forEach(recipe => {
          if (recipe) {
            recipeMap.set(recipe.id, recipe.title);
          }
        });

        console.log('Recipe map:', recipeMap);

        // Update grocery lists with recipe titles
        this.groceryLists = groceryLists.map(groceryList => ({
          ...groceryList,
          meals: groceryList.meals.map(meal => ({
            ...meal,
            recipeTitle: meal.recipeId ? recipeMap.get(meal.recipeId) : undefined
          }))
        }));

        console.log('Final grocery lists with recipes:', this.groceryLists);
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
    const date = new Date(dateString);
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
      const day = meal.dayOfMeal;
      if (!groups[day]) {
        groups[day] = [];
      }
      groups[day].push(meal);
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

}
