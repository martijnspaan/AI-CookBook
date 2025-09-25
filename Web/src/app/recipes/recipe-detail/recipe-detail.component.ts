import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RecipeService } from '../../services/recipe.service';
import { Recipe, UpdateRecipeRequest } from '../../models/recipe.model';
import { PageTitleService } from '../../services/page-title.service';
import { FooterService } from '../../services/footer.service';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recipe-detail.component.html',
  styleUrl: './recipe-detail.component.scss'
})
export class RecipeDetailComponent implements OnInit, OnDestroy, AfterViewInit {
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
    private readonly recipeService: RecipeService,
    private readonly pageTitleService: PageTitleService,
    private readonly footerService: FooterService
  ) { }

  ngOnInit(): void {
    this.setupFooterButtons();
    
    const recipeId = this.activatedRoute.snapshot.paramMap.get('id');
    if (recipeId) {
      this.loadRecipeById(recipeId);
    } else {
      this.errorMessage = 'No recipe ID provided';
    }
  }

  ngAfterViewInit(): void {
    // Page title will be set after recipe is loaded in loadRecipeById method
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
    this.footerService.resetFooterConfig();
  }

  private setupFooterButtons(): void {
    this.footerService.setFooterConfig({
      showLeftButton: true,
      leftButtonText: 'Back to Recipes',
      leftButtonIcon: 'fas fa-arrow-left',
      leftButtonClass: 'btn-outline-secondary',
      leftButtonClickHandler: () => this.navigateBackToRecipesList(),
      showRightButton: true,
      rightButtonText: 'Edit Recipe',
      rightButtonIcon: 'fas fa-edit',
      rightButtonClass: 'btn-primary',
      rightButtonClickHandler: () => this.onRightButtonClick()
    });
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
          // Use setTimeout to defer page title setting to next change detection cycle
          setTimeout(() => {
            this.pageTitleService.setPageTitle(recipe.title);
          }, 0);
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
    this.updateFooterButtons();
  }

  cancelEditingMode(): void {
    this.isEditingMode = false;
    if (this.recipe) {
      this.editedRecipe = { ...this.recipe };
    }
    this.updateFooterButtons();
  }

  private updateFooterButtons(): void {
    if (this.isEditingMode) {
      this.footerService.setFooterConfig({
        rightButtonText: 'Save Changes',
        rightButtonIcon: 'fas fa-save',
        rightButtonClass: 'btn-success'
      });
    } else {
      this.footerService.setFooterConfig({
        rightButtonText: 'Edit Recipe',
        rightButtonIcon: 'fas fa-edit',
        rightButtonClass: 'btn-primary'
      });
    }
  }

  onRightButtonClick(): void {
    if (this.isEditingMode) {
      this.saveRecipeChanges();
    } else {
      this.enableEditingMode();
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
          this.updateFooterButtons();
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

