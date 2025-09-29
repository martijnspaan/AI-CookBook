export interface RecipeSettings {
  id: string;
  tags: string[];
  ingredients: string[];
  units: string[];
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateRecipeSettingsRequest {
  tags: string[];
  ingredients: string[];
  units: string[];
  categories: string[];
}
