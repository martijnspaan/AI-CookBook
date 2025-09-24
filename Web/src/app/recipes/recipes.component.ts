import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { RecipeService } from '../services/recipe.service';
import { Recipe, Ingredient } from '../models/recipe.model';

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './recipes.component.html',
  styleUrl: './recipes.component.scss'
})
export class RecipesComponent implements OnInit {
  recipes: Recipe[] = [];
  loading = false;
  error: string | null = null;
  creating = false;
  createRecipeForm: FormGroup;

  constructor(
    private recipeService: RecipeService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.createRecipeForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      tags: [''],
      ingredients: this.fb.array([]),
      recipeSteps: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadRecipes();
  }

  get ingredientsArray(): FormArray {
    return this.createRecipeForm.get('ingredients') as FormArray;
  }

  get recipeStepsArray(): FormArray {
    return this.createRecipeForm.get('recipeSteps') as FormArray;
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

  openCreateModal(): void {
    this.createRecipeForm.reset();
    this.ingredientsArray.clear();
    this.recipeStepsArray.clear();
    // Add one empty ingredient and one empty recipe step by default
    this.addIngredient();
    this.addRecipeStep();
    
    // Open the modal using jQuery or native DOM manipulation
    const modal = document.getElementById('createRecipeModal');
    if (modal) {
      // Try Bootstrap 5 approach first
      if ((window as any).bootstrap) {
        const modalInstance = new (window as any).bootstrap.Modal(modal);
        modalInstance.show();
      } else {
        // Fallback: manually show the modal
        modal.classList.add('show');
        modal.style.display = 'block';
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        
        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        backdrop.id = 'modal-backdrop';
        document.body.appendChild(backdrop);
      }
    }
  }

  addIngredient(): void {
    const ingredientGroup = this.fb.group({
      name: ['', Validators.required],
      amountValue: [0, [Validators.required, Validators.min(0)]],
      amountUnit: ['', Validators.required],
      type: ['', Validators.required]
    });
    this.ingredientsArray.push(ingredientGroup);
  }

  removeIngredient(index: number): void {
    this.ingredientsArray.removeAt(index);
  }

  addRecipeStep(): void {
    this.recipeStepsArray.push(this.fb.control('', Validators.required));
  }

  removeRecipeStep(index: number): void {
    this.recipeStepsArray.removeAt(index);
  }

  onSubmit(): void {
    if (this.createRecipeForm.valid) {
      this.creating = true;
      
      const formValue = this.createRecipeForm.value;
      
      // Parse tags
      const tags = formValue.tags ? formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [];
      
      // Transform ingredients
      const ingredients: Ingredient[] = formValue.ingredients.map((ingredient: any) => ({
        name: ingredient.name,
        type: ingredient.type,
        amount: {
          value: ingredient.amountValue,
          unit: ingredient.amountUnit
        }
      }));

      const newRecipe: Omit<Recipe, 'id'> = {
        title: formValue.title,
        description: formValue.description,
        tags: tags,
        ingredients: ingredients,
        recipe: formValue.recipeSteps
      };

      this.recipeService.createRecipe(newRecipe).subscribe({
        next: (createdRecipe) => {
          this.recipes.unshift(createdRecipe); // Add to beginning of list
          this.creating = false;
          // Close modal
          this.closeModal();
        },
        error: (error) => {
          console.error('Error creating recipe:', error);
          this.creating = false;
          alert('Failed to create recipe. Please try again.');
        }
      });
    }
  }

  closeModal(): void {
    const modal = document.getElementById('createRecipeModal');
    if (modal) {
      // Try Bootstrap 5 approach first
      if ((window as any).bootstrap) {
        const modalInstance = (window as any).bootstrap.Modal.getInstance(modal);
        if (modalInstance) {
          modalInstance.hide();
        }
      } else {
        // Fallback: manually hide the modal
        modal.classList.remove('show');
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        
        // Remove backdrop
        const backdrop = document.getElementById('modal-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
      }
    }
  }

  onCancel(): void {
    this.closeModal();
  }
}
