import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigurationTabComponent, ConfigurationItem } from '../shared/configuration-tab.component';
import { RecipeSettingsService } from '../../services/recipe-settings.service';
import { RecipeSettings, UpdateRecipeSettingsRequest } from '../../models/recipe-settings.model';

@Component({
  selector: 'app-configuration-categories',
  standalone: true,
  imports: [ConfigurationTabComponent, TranslateModule],
  templateUrl: './configuration-categories.component.html',
  styleUrl: './configuration-categories.component.scss'
})
export class ConfigurationCategoriesComponent implements OnInit, OnDestroy {
  categories: ConfigurationItem[] = [];
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
            this.categories = settings.categories.map((category, index) => ({
              id: (index + 1).toString(),
              value: category
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

  onCategoryAdded(value: string): void {
    const newCategory: ConfigurationItem = {
      id: (this.categories.length + 1).toString(),
      value: value.trim()
    };
    this.categories.push(newCategory);
    this.updateRecipeSettings();
  }

  onCategoryDeleted(id: string): void {
    this.categories = this.categories.filter(category => category.id !== id);
    this.updateRecipeSettings();
  }

  onCategoriesReordered(reorderedCategories: ConfigurationItem[]): void {
    this.categories = reorderedCategories;
    this.updateRecipeSettings();
  }

  private updateRecipeSettings(): void {
    const categories = this.categories.map(category => category.value);
    
    // Get current settings and update only categories
    this.recipeSettingsService.getRecipeSettings()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (currentSettings) => {
          const updateRequest: UpdateRecipeSettingsRequest = {
            tags: currentSettings?.tags || [],
            ingredients: currentSettings?.ingredients || [],
            units: currentSettings?.units || [],
            categories: categories
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
