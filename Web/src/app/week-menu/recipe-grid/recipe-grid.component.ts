import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RecipeService } from '../../services/recipe.service';
import { MealTypeTranslationService } from '../../services/meal-type-translation.service';
import { Recipe } from '../../models/recipe.model';

@Component({
  selector: 'app-recipe-grid',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './recipe-grid.component.html',
  styleUrl: './recipe-grid.component.scss'
})
export class RecipeGridComponent implements OnInit, OnDestroy {
  @Input() selectedMealType: 'breakfast' | 'lunch' | 'dinner' | null = null;
  @Output() recipeSelected = new EventEmitter<{ recipe: Recipe; mealType: string }>();

  recipes: Recipe[] = [];
  isLoadingRecipes = false;
  errorMessage: string | null = null;
  private readonly destroySubject = new Subject<void>();

  constructor(
    private readonly recipeService: RecipeService,
    private readonly translate: TranslateService,
    private readonly mealTypeTranslationService: MealTypeTranslationService
  ) {}

  ngOnInit(): void {
    this.loadAllRecipes();
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  loadAllRecipes(): void {
    this.isLoadingRecipes = true;
    this.errorMessage = null;
    
    this.recipeService.getAllRecipes()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (recipes) => {
          this.recipes = recipes;
          this.isLoadingRecipes = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load recipes. Please make sure the API is running.';
          this.isLoadingRecipes = false;
          console.error('Error loading recipes:', error);
        }
      });
  }

  selectRecipe(recipe: Recipe): void {
    if (this.selectedMealType) {
      this.recipeSelected.emit({
        recipe: recipe,
        mealType: this.selectedMealType
      });
    }
  }

  getTagsAsCommaSeparatedString(tags: string[]): string {
    return tags.join(', ');
  }

  getMealTypeTranslation(mealType: string): string {
    return this.mealTypeTranslationService.getMealTypeTranslation(mealType);
  }
}
