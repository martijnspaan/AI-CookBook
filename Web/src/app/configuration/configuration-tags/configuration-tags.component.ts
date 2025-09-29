import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConfigurationTabComponent, ConfigurationItem } from '../shared/configuration-tab.component';
import { RecipeSettingsService } from '../../services/recipe-settings.service';
import { RecipeSettings, UpdateRecipeSettingsRequest } from '../../models/recipe-settings.model';

@Component({
  selector: 'app-configuration-tags',
  standalone: true,
  imports: [ConfigurationTabComponent],
  templateUrl: './configuration-tags.component.html',
  styleUrl: './configuration-tags.component.scss'
})
export class ConfigurationTagsComponent implements OnInit, OnDestroy {
  tags: ConfigurationItem[] = [];
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
            this.tags = settings.tags.map((tag, index) => ({
              id: (index + 1).toString(),
              value: tag
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

  onTagAdded(value: string): void {
    const newTag: ConfigurationItem = {
      id: (this.tags.length + 1).toString(),
      value: value.trim()
    };
    this.tags.push(newTag);
    this.updateRecipeSettings();
  }

  onTagDeleted(id: string): void {
    this.tags = this.tags.filter(tag => tag.id !== id);
    this.updateRecipeSettings();
  }

  private updateRecipeSettings(): void {
    const tags = this.tags.map(tag => tag.value);
    
    // Get current settings and update only tags
    this.recipeSettingsService.getRecipeSettings()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (currentSettings) => {
          const updateRequest: UpdateRecipeSettingsRequest = {
            tags: tags,
            ingredients: currentSettings?.ingredients || [],
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
