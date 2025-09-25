import { Routes } from '@angular/router';
import { RecipesComponent } from './recipes/recipes.component';
import { RecipeDetailComponent } from './recipes/recipe-detail/recipe-detail.component';
import { GroceryListComponent } from './grocery-list/grocery-list.component';
import { WeekMenuComponent } from './week-menu/week-menu.component';
import { CookbooksComponent } from './cookbooks/cookbooks.component';

export const routes: Routes = [
  { path: '', redirectTo: '/recipes', pathMatch: 'full' },
  { path: 'recipes', component: RecipesComponent },
  { path: 'recipes/:id', component: RecipeDetailComponent },
  { path: 'grocery-list', component: GroceryListComponent },
  { path: 'week-menu', component: WeekMenuComponent },
  { path: 'cookbooks', component: CookbooksComponent }
];
