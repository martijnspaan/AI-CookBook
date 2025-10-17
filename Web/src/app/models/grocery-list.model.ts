export interface Meal {
  dayOfMeal: string;
  mealType: string;
  recipeId?: string;
  servingCount?: number;
}

export interface IngredientState {
  ingredientName: string;
  state: string;
}

export interface GroceryList {
  id: string;
  dayOfGrocery: string;
  meals: Meal[];
  ingredientsState: IngredientState[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroceryListRequest {
  dayOfGrocery: string;
  meals: Meal[];
}

export interface UpdateIngredientStateRequest {
  ingredientName: string;
  state: string;
}
