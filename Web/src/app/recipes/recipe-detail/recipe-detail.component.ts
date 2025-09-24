import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../models/recipe.model';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recipe-detail.component.html',
  styleUrl: './recipe-detail.component.scss'
})
export class RecipeDetailComponent implements OnInit {
  recipe: Recipe | null = null;
  loading = false;
  error: string | null = null;
  isEditing = false;
  editedRecipe: Recipe | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private recipeService: RecipeService
  ) { }

  ngOnInit(): void {
    const recipeId = this.route.snapshot.paramMap.get('id');
    if (recipeId) {
      this.loadRecipe(recipeId);
    } else {
      this.error = 'No recipe ID provided';
    }
  }

  loadRecipe(id: string): void {
    this.loading = true;
    this.error = null;
    
    this.recipeService.getRecipe(id).subscribe({
      next: (recipe) => {
        this.recipe = recipe;
        this.editedRecipe = { ...recipe };
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load recipe details';
        this.loading = false;
        console.error('Error loading recipe:', error);
      }
    });
  }

  startEditing(): void {
    this.isEditing = true;
  }

  cancelEditing(): void {
    this.isEditing = false;
    if (this.recipe) {
      this.editedRecipe = { ...this.recipe };
    }
  }

  saveChanges(): void {
    if (!this.editedRecipe) return;

    this.loading = true;
    this.error = null;

    this.recipeService.updateRecipe(this.editedRecipe).subscribe({
      next: (updatedRecipe) => {
        this.recipe = updatedRecipe;
        this.editedRecipe = { ...updatedRecipe };
        this.isEditing = false;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to update recipe';
        this.loading = false;
        console.error('Error updating recipe:', error);
      }
    });
  }

  addTag(): void {
    if (!this.editedRecipe) return;
    this.editedRecipe.tags.push('');
  }

  removeTag(index: number): void {
    if (!this.editedRecipe) return;
    this.editedRecipe.tags.splice(index, 1);
  }

  addRecipeStep(): void {
    if (!this.editedRecipe) return;
    this.editedRecipe.recipe.push('');
  }

  removeRecipeStep(index: number): void {
    if (!this.editedRecipe) return;
    this.editedRecipe.recipe.splice(index, 1);
  }

  goBack(): void {
    this.router.navigate(['/recipes']);
  }
}
