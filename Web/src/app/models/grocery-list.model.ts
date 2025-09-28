export interface Meal {
  dayOfMeal: string;
  mealType: string;
  recipeId?: string;
}

export interface GroceryList {
  id: string;
  dayOfGrocery: string;
  meals: Meal[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroceryListRequest {
  dayOfGrocery: string;
  meals: Meal[];
}
