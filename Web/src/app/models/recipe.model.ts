export interface Ingredient {
  name: string;
  type: string;
  amount: {
    value: number;
    unit: string;
  };
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  tags: string[];
  ingredients: Ingredient[];
  recipe: string[];
}
