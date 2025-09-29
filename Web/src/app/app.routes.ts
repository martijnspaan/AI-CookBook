import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/grocery-list', pathMatch: 'full' },
  { 
    path: 'recipes', 
    loadComponent: () => import('./recipes/recipes.component').then(m => m.RecipesComponent)
  },
  { 
    path: 'recipes/:id', 
    loadComponent: () => import('./recipes/recipe-detail/recipe-detail.component').then(m => m.RecipeDetailComponent)
  },
  { 
    path: 'grocery-list', 
    loadComponent: () => import('./grocery-list/grocery-list.component').then(m => m.GroceryListComponent)
  },
  { 
    path: 'grocery-list/:id', 
    loadComponent: () => import('./grocery-list/grocery-list-details/grocery-list-details.component').then(m => m.GroceryListDetailsComponent)
  },
  { 
    path: 'week-menu', 
    loadComponent: () => import('./week-menu/week-menu.component').then(m => m.WeekMenuComponent)
  },
  { 
    path: 'cookbooks', 
    loadComponent: () => import('./cookbooks/cookbooks.component').then(m => m.CookbooksComponent)
  },
  { 
    path: 'recipe-settings', 
    loadComponent: () => import('./configuration/configuration.component').then(m => m.ConfigurationComponent)
  },
  { 
    path: 'showcase', 
    loadComponent: () => import('./showcase-menu/showcase-menu.component').then(m => m.ShowcaseMenuComponent)
  }
];
