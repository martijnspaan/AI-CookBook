import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConfigurationTabComponent, ConfigurationItem } from '../shared/configuration-tab.component';
import { RecipeSettingsService, RecipeSettings, UpdateRecipeSettingsRequest } from '../../services/recipe-settings.service';

@Component({
  selector: 'app-configuration-units',
  standalone: true,
  imports: [ConfigurationTabComponent],
  templateUrl: './configuration-units.component.html',
  styleUrl: './configuration-units.component.scss'
})
export class ConfigurationUnitsComponent implements OnInit, OnDestroy {
  units: ConfigurationItem[] = [];
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
            this.units = settings.units.map((unit, index) => ({
              id: (index + 1).toString(),
              value: unit
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

  onUnitAdded(value: string): void {
    const newUnit: ConfigurationItem = {
      id: (this.units.length + 1).toString(),
      value: value.trim().toLowerCase()
    };
    this.units.push(newUnit);
    this.updateRecipeSettings();
  }

  onUnitDeleted(id: string): void {
    this.units = this.units.filter(unit => unit.id !== id);
    this.updateRecipeSettings();
  }

  private updateRecipeSettings(): void {
    const units = this.units.map(unit => unit.value);
    
    // Get current settings and update only units
    this.recipeSettingsService.getRecipeSettings()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (currentSettings) => {
          const updateRequest: UpdateRecipeSettingsRequest = {
            tags: currentSettings?.tags || [],
            ingredients: currentSettings?.ingredients || [],
            units: units,
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
