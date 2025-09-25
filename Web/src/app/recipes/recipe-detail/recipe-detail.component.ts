import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RecipeService } from '../../services/recipe.service';
import { Recipe, UpdateRecipeRequest } from '../../models/recipe.model';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recipe-detail.component.html',
  styleUrl: './recipe-detail.component.scss'
})
export class RecipeDetailComponent implements OnInit, OnDestroy {
  recipe: Recipe | null = null;
  isLoadingRecipe = false;
  isUpdatingRecipe = false;
  errorMessage: string | null = null;
  isEditingMode = false;
  editedRecipe: Recipe | null = null;
  private readonly destroySubject = new Subject<void>();

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly recipeService: RecipeService
  ) { }

  ngOnInit(): void {
    const recipeId = this.activatedRoute.snapshot.paramMap.get('id');
    if (recipeId) {
      this.loadRecipeById(recipeId);
    } else {
      this.errorMessage = 'No recipe ID provided';
    }
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  private loadRecipeById(recipeId: string): void {
    this.isLoadingRecipe = true;
    this.errorMessage = null;
    
    this.recipeService.getRecipeById(recipeId)
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (recipe) => {
          this.recipe = recipe;
          this.editedRecipe = { ...recipe };
          this.isLoadingRecipe = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load recipe details';
          this.isLoadingRecipe = false;
          console.error('Error loading recipe:', error);
        }
      });
  }

  enableEditingMode(): void {
    this.isEditingMode = true;
  }

  cancelEditingMode(): void {
    this.isEditingMode = false;
    if (this.recipe) {
      this.editedRecipe = { ...this.recipe };
    }
  }

  saveRecipeChanges(): void {
    if (!this.editedRecipe || !this.recipe) return;

    this.isUpdatingRecipe = true;
    this.errorMessage = null;

    const updateRequest: UpdateRecipeRequest = {
      title: this.editedRecipe.title,
      description: this.editedRecipe.description,
      tags: this.editedRecipe.tags,
      ingredients: this.editedRecipe.ingredients,
      recipe: this.editedRecipe.recipe
    };

    this.recipeService.updateExistingRecipe(this.recipe.id, updateRequest)
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (updatedRecipe) => {
          this.recipe = updatedRecipe;
          this.editedRecipe = { ...updatedRecipe };
          this.isEditingMode = false;
          this.isUpdatingRecipe = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to update recipe';
          this.isUpdatingRecipe = false;
          console.error('Error updating recipe:', error);
        }
      });
  }

  addEmptyTag(): void {
    if (!this.editedRecipe) return;
    this.editedRecipe.tags.push('');
  }

  removeTagAtIndex(index: number): void {
    if (!this.editedRecipe || this.editedRecipe.tags.length <= 1) return;
    this.editedRecipe.tags.splice(index, 1);
  }

  addEmptyRecipeStep(): void {
    if (!this.editedRecipe) return;
    this.editedRecipe.recipe.push('');
  }

  removeRecipeStepAtIndex(index: number): void {
    if (!this.editedRecipe || this.editedRecipe.recipe.length <= 1) return;
    this.editedRecipe.recipe.splice(index, 1);
  }

  navigateBackToRecipesList(): void {
    this.router.navigate(['/recipes']);
  }
}

