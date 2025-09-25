export interface Meal {
  dayOfMeal: string;
  mealType: string;
  recipeId?: string;
}

export interface GroceryList {
  id: string;
  dayOfShopping: string;
  meals: Meal[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroceryListRequest {
  dayOfShopping: string;
  meals: Meal[];
}
