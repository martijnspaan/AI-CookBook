export interface IngredientAmount {
  value: number;
  unit: string;
}

export interface Ingredient {
  name: string;
  type: string;
  amount: IngredientAmount;
}

export interface Recipe {
  readonly id: string;
  title: string;
  description: string;
  tags: string[];
  ingredients: Ingredient[];
  recipe: string[];
  cookbookId?: string;
  mealTypes: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateRecipeRequest {
  title: string;
  description: string;
  tags: string[];
  ingredients: Ingredient[];
  recipe: string[];
  cookbookId?: string;
  mealTypes: string[];
}

export interface UpdateRecipeRequest {
  title?: string;
  description?: string;
  tags?: string[];
  ingredients?: Ingredient[];
  recipe?: string[];
  cookbookId?: string;
  mealTypes?: string[];
}
