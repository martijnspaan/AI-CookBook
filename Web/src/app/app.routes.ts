import { Routes } from '@angular/router';
import { RecipesComponent } from './recipes/recipes.component';
import { RecipeDetailComponent } from './recipes/recipe-detail/recipe-detail.component';
import { GroceryListComponent } from './grocery-list/grocery-list.component';
import { GroceryListDetailsComponent } from './grocery-list/grocery-list-details/grocery-list-details.component';
import { WeekMenuComponent } from './week-menu/week-menu.component';
import { CookbooksComponent } from './cookbooks/cookbooks.component';
import { ConfigurationComponent } from './configuration/configuration.component';

export const routes: Routes = [
  { path: '', redirectTo: '/recipes', pathMatch: 'full' },
  { path: 'recipes', component: RecipesComponent },
  { path: 'recipes/:id', component: RecipeDetailComponent },
  { path: 'grocery-list', component: GroceryListComponent },
  { path: 'grocery-list/:id', component: GroceryListDetailsComponent },
  { path: 'week-menu', component: WeekMenuComponent },
  { path: 'cookbooks', component: CookbooksComponent },
  { path: 'recipe-settings', component: ConfigurationComponent }
];
