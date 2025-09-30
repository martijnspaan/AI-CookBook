import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class MealTypeTranslationService {

  // Centralized meal type mapping - single source of truth
  private readonly mealTypeMap: { [key: string]: string } = {
    'ontbijt': 'BREAKFAST',
    'lunch': 'LUNCH',
    'diner': 'DINNER',
    'snack': 'SNACK',
    'breakfast': 'BREAKFAST',
    'dinner': 'DINNER'
  };

  constructor(private readonly translate: TranslateService) { }

  /**
   * Maps meal type values to their corresponding translation keys
   * @param mealType The meal type value (can be in Dutch or English)
   * @returns The corresponding translation key
   */
  private getMealTypeKey(mealType: string): string {
    return this.mealTypeMap[mealType.toLowerCase()] || mealType.toUpperCase();
  }

  /**
   * Maps meal type values to their corresponding translation keys and returns the translated text
   * @param mealType The meal type value (can be in Dutch or English)
   * @returns The translated meal type text
   */
  getMealTypeTranslation(mealType: string): string {
    const key = this.getMealTypeKey(mealType);
    return this.translate.instant(`MEAL_TYPES.${key}`);
  }

  /**
   * Gets the translation key for a given meal type
   * @param mealType The meal type value
   * @returns The corresponding translation key
   */
  getMealTypeTranslationKey(mealType: string): string {
    return this.getMealTypeKey(mealType);
  }

  /**
   * Gets all available meal type options for dropdowns/selects
   * @returns Array of meal type options with value and label
   */
  getMealTypeOptions(): Array<{ value: string; label: string }> {
    const mealTypeKeys = ['breakfast', 'lunch', 'dinner', 'snack'];
    
    return mealTypeKeys.map(key => ({
      value: key,
      label: this.translate.instant(`MEAL_TYPES.${key.toUpperCase()}`)
    }));
  }
}
