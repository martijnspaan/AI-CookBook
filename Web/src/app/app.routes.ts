import { Routes } from '@angular/router';
import { RecipesComponent } from './recipes/recipes.component';

export const routes: Routes = [
  { path: '', redirectTo: '/recipes', pathMatch: 'full' },
  { path: 'recipes', component: RecipesComponent }
];
