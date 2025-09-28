import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Recipe } from '../models/recipe.model';

export interface RecipeSelectionDialogData {
  isVisible: boolean;
  selectedMealType: 'breakfast' | 'lunch' | 'dinner' | null;
  selectedDate: Date | null;
  currentRecipe: Recipe | null;
}

@Injectable({
  providedIn: 'root'
})
export class RecipeSelectionDialogService {
  private dialogStateSubject = new BehaviorSubject<RecipeSelectionDialogData>({
    isVisible: false,
    selectedMealType: null,
    selectedDate: null,
    currentRecipe: null
  });

  private recipeSelectedSubject = new Subject<{ recipe: Recipe; mealType: string }>();
  private recipeRemovedSubject = new Subject<{ mealType: string; date: Date }>();
  private dialogClosedSubject = new Subject<void>();

  dialogState$ = this.dialogStateSubject.asObservable();
  recipeSelected$ = this.recipeSelectedSubject.asObservable();
  recipeRemoved$ = this.recipeRemovedSubject.asObservable();
  dialogClosed$ = this.dialogClosedSubject.asObservable();

  openDialog(selectedMealType: 'breakfast' | 'lunch' | 'dinner', selectedDate: Date, currentRecipe: Recipe | null = null): void {
    this.dialogStateSubject.next({
      isVisible: true,
      selectedMealType,
      selectedDate,
      currentRecipe
    });
  }

  closeDialog(): void {
    this.dialogStateSubject.next({
      isVisible: false,
      selectedMealType: null,
      selectedDate: null,
      currentRecipe: null
    });
    this.dialogClosedSubject.next();
  }

  selectRecipe(recipe: Recipe, mealType: string): void {
    this.recipeSelectedSubject.next({ recipe, mealType });
    this.closeDialog();
  }

  removeRecipe(mealType: string, date: Date): void {
    this.recipeRemovedSubject.next({ mealType, date });
    this.closeDialog();
  }
}
