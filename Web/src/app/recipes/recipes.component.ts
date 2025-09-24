import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RecipeService } from '../services/recipe.service';
import { Recipe } from '../models/recipe.model';

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipes.component.html',
  styleUrl: './recipes.component.scss'
})
export class RecipesComponent implements OnInit {
  recipes: Recipe[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private recipeService: RecipeService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadRecipes();
  }

  loadRecipes(): void {
    this.loading = true;
    this.error = null;
    
    this.recipeService.getRecipes().subscribe({
      next: (recipes) => {
        this.recipes = recipes;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load recipes. Please make sure the API is running.';
        this.loading = false;
        console.error('Error loading recipes:', error);
      }
    });
  }

  getTagsAsString(tags: string[]): string {
    return tags.join(', ');
  }

  viewRecipe(recipe: Recipe): void {
    this.router.navigate(['/recipes', recipe.id]);
  }

  deleteRecipe(recipe: Recipe, event: Event): void {
    event.stopPropagation(); // Prevent row click event
    
    if (confirm(`Are you sure you want to delete "${recipe.title}"?`)) {
      this.recipeService.deleteRecipe(recipe.id).subscribe({
        next: () => {
          // Remove the recipe from the local array
          this.recipes = this.recipes.filter(r => r.id !== recipe.id);
        },
        error: (error) => {
          console.error('Error deleting recipe:', error);
          alert('Failed to delete recipe. Please try again.');
        }
      });
    }
  }
}
