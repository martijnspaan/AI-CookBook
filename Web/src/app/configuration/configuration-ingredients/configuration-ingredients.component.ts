import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConfigurationTabComponent, ConfigurationItem } from '../shared/configuration-tab.component';
import { RecipeSettingsService } from '../../services/recipe-settings.service';
import { RecipeSettings, UpdateRecipeSettingsRequest } from '../../models/recipe-settings.model';

@Component({
  selector: 'app-configuration-ingredients',
  standalone: true,
  imports: [ConfigurationTabComponent],
  templateUrl: './configuration-ingredients.component.html',
  styleUrl: './configuration-ingredients.component.scss'
})
export class ConfigurationIngredientsComponent implements OnInit, OnDestroy {
  ingredients: ConfigurationItem[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  private readonly destroySubject = new Subject<void>();

  constructor(private readonly recipeSettingsService: RecipeSettingsService) {}

  ngOnInit(): void {
    this.loadRecipeSettings();
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  private loadRecipeSettings(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.recipeSettingsService.getRecipeSettings()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (settings) => {
          if (settings) {
            this.ingredients = settings.ingredients.map((ingredient, index) => ({
              id: (index + 1).toString(),
              value: ingredient
            }));
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load recipe settings';
          this.isLoading = false;
          console.error('Error loading recipe settings:', error);
        }
      });
  }

  onIngredientAdded(value: string): void {
    const newIngredient: ConfigurationItem = {
      id: (this.ingredients.length + 1).toString(),
      value: value.trim()
    };
    this.ingredients.push(newIngredient);
    this.updateRecipeSettings();
  }

  onIngredientDeleted(id: string): void {
    this.ingredients = this.ingredients.filter(ingredient => ingredient.id !== id);
    this.updateRecipeSettings();
  }

  private updateRecipeSettings(): void {
    const ingredients = this.ingredients.map(ingredient => ingredient.value);
    
    // Get current settings and update only ingredients
    this.recipeSettingsService.getRecipeSettings()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (currentSettings) => {
          const updateRequest: UpdateRecipeSettingsRequest = {
            tags: currentSettings?.tags || [],
            ingredients: ingredients,
            units: currentSettings?.units || [],
            categories: currentSettings?.categories || []
          };

          this.recipeSettingsService.updateRecipeSettings(updateRequest)
            .pipe(takeUntil(this.destroySubject))
            .subscribe({
              next: () => {
                console.log('Recipe settings updated successfully');
              },
              error: (error) => {
                console.error('Error updating recipe settings:', error);
                // Revert the local changes
                this.loadRecipeSettings();
              }
            });
        },
        error: (error) => {
          console.error('Error getting current recipe settings:', error);
        }
      });
  }
}
