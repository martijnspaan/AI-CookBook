import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageTitleService } from '../../services/page-title.service';
import { GroceryListService } from '../../services/grocery-list.service';
import { RecipeService } from '../../services/recipe.service';
import { FooterService } from '../../services/footer.service';
import { GroceryList, Meal, IngredientState } from '../../models/grocery-list.model';
import { Recipe, Ingredient } from '../../models/recipe.model';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';

interface MealWithRecipe extends Meal {
  recipeTitle?: string;
  recipe?: Recipe;
}

interface GroceryListWithRecipes extends GroceryList {
  meals: MealWithRecipe[];
}

interface AggregatedIngredient {
  name: string;
  type: string;
  totalAmount: number;
  unit: string;
  recipes: string[];
  state: IngredientStateType;
}

type IngredientStateType = 'List' | 'Basket' | 'Online' | 'Stock';

interface DayGroup {
  day: string;
  meals: MealWithRecipe[];
}

interface IngredientTypeGroup {
  type: string;
  ingredients: AggregatedIngredient[];
}

@Component({
  selector: 'app-grocery-list-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grocery-list-details.component.html',
  styleUrl: './grocery-list-details.component.scss'
})
export class GroceryListDetailsComponent implements OnInit, OnDestroy {
  groceryList: GroceryListWithRecipes | null = null;
  aggregatedIngredients: AggregatedIngredient[] = [];
  ingredientTypeGroups: IngredientTypeGroup[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;
  
  // Ingredient state management
  private ingredientStates = new Map<string, IngredientStateType>();
  private readonly destroySubject = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pageTitleService: PageTitleService,
    private groceryListService: GroceryListService,
    private recipeService: RecipeService,
    private footerService: FooterService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.setupFooterButtons();
    
    const groceryListId = this.route.snapshot.paramMap.get('id');
    if (groceryListId) {
      this.loadGroceryListDetails(groceryListId);
    } else {
      this.errorMessage = 'Grocery list ID not provided';
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
    this.footerService.resetFooterConfig();
  }

  private setupFooterButtons(): void {
    this.footerService.setFooterConfigFromTranslation({
      showLeftButton: true,
      leftButtonTranslationKey: 'BUTTONS.BACK_TO_GROCERY_LISTS',
      leftButtonIcon: 'fas fa-arrow-left',
      leftButtonClass: 'btn-outline-secondary',
      leftButtonClickHandler: () => this.goBack(),
      showRightButton: false,
      rightButtonTranslationKey: '',
      rightButtonIcon: '',
      rightButtonClass: 'btn-primary',
      rightButtonClickHandler: null
    });
  }

  private getFormattedShoppingDate(dateString: string): string {
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

  private loadGroceryListDetails(groceryListId: string): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.groceryListService.getGroceryListById(groceryListId).subscribe({
      next: (groceryList) => {
        this.loadGroceryListWithRecipes(groceryList);
      },
      error: (error) => {
        console.error('Error loading grocery list:', error);
        this.errorMessage = 'Failed to load grocery list details. Please try again.';
        this.isLoading = false;
      }
    });
  }

  private loadGroceryListWithRecipes(groceryList: GroceryList): void {
    // Load existing ingredient states from the database
    this.loadIngredientStatesFromDatabase(groceryList.ingredientsState || []);
    
    if (groceryList.meals.length === 0) {
      this.groceryList = groceryList as GroceryListWithRecipes;
      this.aggregatedIngredients = [];
      this.isLoading = false;
      const formattedDate = this.getFormattedShoppingDate(groceryList.dayOfGrocery);
      this.pageTitleService.setPageTitle(`Groceries ${formattedDate}`);
      return;
    }

    // Collect all unique recipe IDs
    const recipeIds = new Set<string>();
    groceryList.meals.forEach(meal => {
      if (meal.recipeId) {
        recipeIds.add(meal.recipeId);
      }
    });

    if (recipeIds.size === 0) {
      this.groceryList = groceryList as GroceryListWithRecipes;
      this.aggregatedIngredients = [];
      this.isLoading = false;
      const formattedDate = this.getFormattedShoppingDate(groceryList.dayOfGrocery);
      this.pageTitleService.setPageTitle(`Groceries ${formattedDate}`);
      return;
    }

    // Fetch all recipes in parallel
    const recipeObservables = Array.from(recipeIds).map(id =>
      this.recipeService.getRecipeById(id).pipe(
        catchError((error) => {
          console.error(`Error fetching recipe ${id}:`, error);
          return of(null);
        })
      )
    );

    forkJoin(recipeObservables).subscribe({
      next: (recipes) => {
        // Create a map of recipe ID to recipe
        const recipeMap = new Map<string, Recipe>();
        recipes.forEach(recipe => {
          if (recipe) {
            recipeMap.set(recipe.id, recipe);
          }
        });

        // Update grocery list with recipe data
        this.groceryList = {
          ...groceryList,
          meals: groceryList.meals.map(meal => ({
            ...meal,
            recipeTitle: meal.recipeId ? recipeMap.get(meal.recipeId)?.title : undefined,
            recipe: meal.recipeId ? recipeMap.get(meal.recipeId) : undefined
          }))
        };

        // Aggregate ingredients
        this.aggregateIngredients();
        this.isLoading = false;
        const formattedDate = this.getFormattedShoppingDate(groceryList.dayOfGrocery);
        this.pageTitleService.setPageTitle(`Groceries ${formattedDate}`);
      },
      error: (error) => {
        console.error('Error loading recipes:', error);
        this.groceryList = groceryList as GroceryListWithRecipes;
        this.aggregatedIngredients = [];
        this.isLoading = false;
        const formattedDate = this.getFormattedShoppingDate(groceryList.dayOfGrocery);
        this.pageTitleService.setPageTitle(`Groceries ${formattedDate}`);
      }
    });
  }

  private aggregateIngredients(): void {
    if (!this.groceryList) return;

    const ingredientMap = new Map<string, AggregatedIngredient>();

    this.groceryList.meals.forEach(meal => {
      if (meal.recipe && meal.recipe.ingredients) {
        meal.recipe.ingredients.forEach(ingredient => {
          const key = ingredient.name.toLowerCase();
          
          if (ingredientMap.has(key)) {
            const existing = ingredientMap.get(key)!;
            existing.totalAmount += ingredient.amount.value;
            if (!existing.recipes.includes(meal.recipe!.title)) {
              existing.recipes.push(meal.recipe!.title);
            }
          } else {
            ingredientMap.set(key, {
              name: ingredient.name,
              type: ingredient.type,
              totalAmount: ingredient.amount.value,
              unit: ingredient.amount.unit,
              recipes: [meal.recipe!.title],
              state: this.ingredientStates.get(key) || 'List'
            });
          }
        });
      }
    });

    this.aggregatedIngredients = Array.from(ingredientMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));
    
    // Group ingredients by type
    this.groupIngredientsByType();
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
      let normalizedDate: string;
      
      if (typeof meal.dayOfMeal === 'string' && meal.dayOfMeal.match(/^\d{4}-\d{2}-\d{2}$/)) {
        normalizedDate = meal.dayOfMeal;
      } else {
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
    let date: Date;
    
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(dateString);
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  goBack(): void {
    this.router.navigate(['/grocery-list']);
  }

  getIngredientTypeClass(type: string): string {
    const typeMap: { [key: string]: string } = {
      'protein': 'bg-primary',
      'vegetable': 'bg-success',
      'dairy': 'bg-info',
      'grain': 'bg-warning',
      'spice': 'bg-secondary',
      'oil': 'bg-dark',
      'sauce': 'bg-danger',
      'fruit': 'bg-success',
      'nut': 'bg-warning',
      'herb': 'bg-success'
    };
    return typeMap[type.toLowerCase()] || 'bg-light text-dark';
  }

  // Ingredient state management methods
  getIngredientKey(ingredient: AggregatedIngredient): string {
    return ingredient.name.toLowerCase();
  }

  toggleIngredientState(ingredient: AggregatedIngredient): void {
    const key = this.getIngredientKey(ingredient);
    const currentState = ingredient.state;
    
    // Cycle through states: List -> Basket -> Online -> Stock -> List
    const stateOrder: IngredientStateType[] = ['List', 'Basket', 'Online', 'Stock'];
    const currentIndex = stateOrder.indexOf(currentState);
    const nextIndex = (currentIndex + 1) % stateOrder.length;
    const nextState = stateOrder[nextIndex];
    
    ingredient.state = nextState;
    this.ingredientStates.set(key, nextState);
    
    // Persist the state change to the database
    this.persistIngredientState(ingredient, nextState);
    
    // Prevent page scrolling when ingredient state changes
    // by maintaining the current scroll position
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const currentScrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    // Use setTimeout to ensure the DOM has updated before restoring scroll position
    setTimeout(() => {
      window.scrollTo(currentScrollLeft, currentScrollTop);
    }, 0);
  }

  setIngredientState(ingredient: AggregatedIngredient, state: IngredientStateType): void {
    const key = this.getIngredientKey(ingredient);
    ingredient.state = state;
    this.ingredientStates.set(key, state);
    
    // Persist the state change to the database
    this.persistIngredientState(ingredient, state);
    
    // Prevent page scrolling when ingredient state changes
    // by maintaining the current scroll position
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const currentScrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    // Use setTimeout to ensure the DOM has updated before restoring scroll position
    setTimeout(() => {
      window.scrollTo(currentScrollLeft, currentScrollTop);
    }, 0);
  }

  getStateIcon(state: IngredientStateType): string {
    const iconMap: { [key in IngredientStateType]: string } = {
      'List': 'fas fa-list',
      'Basket': 'fas fa-shopping-cart',
      'Online': 'fas fa-laptop',
      'Stock': 'fas fa-home'
    };
    return iconMap[state];
  }

  getStateClass(state: IngredientStateType): string {
    const classMap: { [key in IngredientStateType]: string } = {
      'List': 'state-list',
      'Basket': 'state-basket',
      'Online': 'state-online',
      'Stock': 'state-stock'
    };
    return classMap[state];
  }

  getStateLabel(state: IngredientStateType): string {
    const labelMap: { [key in IngredientStateType]: string } = {
      'List': 'List',
      'Basket': 'Basket',
      'Online': 'Online',
      'Stock': 'Stock'
    };
    return labelMap[state];
  }

  private groupIngredientsByType(): void {
    const typeGroups = new Map<string, AggregatedIngredient[]>();
    
    this.aggregatedIngredients.forEach(ingredient => {
      const type = ingredient.type.toLowerCase();
      if (!typeGroups.has(type)) {
        typeGroups.set(type, []);
      }
      typeGroups.get(type)!.push(ingredient);
    });
    
    // Convert to array and sort by type name
    this.ingredientTypeGroups = Array.from(typeGroups.entries())
      .map(([type, ingredients]) => ({
        type: this.capitalizeFirstLetter(type),
        ingredients: ingredients.sort((a, b) => a.name.localeCompare(b.name))
      }))
      .sort((a, b) => a.type.localeCompare(b.type));
  }

  private capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  private loadIngredientStatesFromDatabase(ingredientStates: IngredientState[]): void {
    this.ingredientStates.clear();
    ingredientStates.forEach(state => {
      const key = state.ingredientName.toLowerCase();
      this.ingredientStates.set(key, state.state as any);
    });
  }

  private persistIngredientState(ingredient: AggregatedIngredient, state: IngredientStateType): void {
    if (!this.groceryList) return;

    const updateRequest = {
      ingredientName: ingredient.name,
      state: state
    };

    this.groceryListService.updateIngredientState(this.groceryList.id, updateRequest)
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (updatedGroceryList) => {
          // Update the local grocery list with the updated ingredient states
          this.groceryList!.ingredientsState = updatedGroceryList.ingredientsState;
        },
        error: (error) => {
          console.error('Error updating ingredient state:', error);
          // Optionally show a user-friendly error message
        }
      });
  }

  // New methods for status-based ingredient filtering and grouping
  getIngredientsByStatus(status: IngredientStateType): AggregatedIngredient[] {
    return this.aggregatedIngredients.filter(ingredient => ingredient.state === status);
  }

  getIngredientTypeGroupsByStatus(status: IngredientStateType): IngredientTypeGroup[] {
    const ingredientsByStatus = this.getIngredientsByStatus(status);
    const typeGroups = new Map<string, AggregatedIngredient[]>();
    
    ingredientsByStatus.forEach(ingredient => {
      const type = ingredient.type.toLowerCase();
      if (!typeGroups.has(type)) {
        typeGroups.set(type, []);
      }
      typeGroups.get(type)!.push(ingredient);
    });
    
    // Convert to array and sort by type name
    return Array.from(typeGroups.entries())
      .map(([type, ingredients]) => ({
        type: this.capitalizeFirstLetter(type),
        ingredients: ingredients.sort((a, b) => a.name.localeCompare(b.name))
      }))
      .sort((a, b) => a.type.localeCompare(b.type));
  }
}
