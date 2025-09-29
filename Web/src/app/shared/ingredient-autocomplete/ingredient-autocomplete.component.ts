import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RecipeSettingsService } from '../../services/recipe-settings.service';
import { RecipeSettings } from '../../models/recipe-settings.model';

@Component({
  selector: 'app-ingredient-autocomplete',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ingredient-autocomplete.component.html',
  styleUrl: './ingredient-autocomplete.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IngredientAutocompleteComponent),
      multi: true
    }
  ]
})
export class IngredientAutocompleteComponent implements OnInit, OnDestroy, OnChanges, ControlValueAccessor {
  @Input() placeholder: string = 'Enter ingredient name';
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() inputValue: string = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() addNewIngredient = new EventEmitter<string>();

  private _value: string = '';
  filteredIngredients: string[] = [];
  showSuggestions: boolean = false;
  availableIngredients: string[] = [];
  isLoading: boolean = false;
  showAddButton: boolean = false;

  get value(): string {
    return this._value;
  }

  set value(val: string) {
    this._value = val;
  }
  
  private readonly destroySubject = new Subject<void>();
  private onChange = (value: string) => {};
  private onTouched = () => {};

  constructor(private readonly recipeSettingsService: RecipeSettingsService) {}

  ngOnInit(): void {
    this.loadIngredients();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['inputValue'] && changes['inputValue'].currentValue !== undefined) {
      this._value = changes['inputValue'].currentValue;
    }
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  loadIngredients(): void {
    this.isLoading = true;
    
    this.recipeSettingsService.getRecipeSettings()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (settings) => {
          if (settings && settings.ingredients) {
            this.availableIngredients = settings.ingredients;
          } else {
            // Fallback to default ingredients
            this.availableIngredients = ['Chicken Breast', 'Olive Oil', 'Onion', 'Garlic', 'Tomato', 'Salt', 'Pepper'];
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading ingredients:', error);
          // Fallback to default ingredients on error
          this.availableIngredients = ['Chicken Breast', 'Olive Oil', 'Onion', 'Garlic', 'Tomato', 'Salt', 'Pepper'];
          this.isLoading = false;
        }
      });
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this._value = target.value;
    this.onChange(this._value);
    this.valueChange.emit(this._value);
    
    if (this._value.length > 0) {
      this.filterIngredients();
      this.showSuggestions = true;
      // Show add button if the current value is not in the available ingredients
      this.showAddButton = !this.availableIngredients.some(ingredient => 
        ingredient.toLowerCase() === this._value.toLowerCase()
      );
    } else {
      this.showSuggestions = false;
      this.showAddButton = false;
    }
  }

  filterIngredients(): void {
    if (this._value.length === 0) {
      this.filteredIngredients = [];
      return;
    }

    this.filteredIngredients = this.availableIngredients
      .filter(ingredient => 
        ingredient.toLowerCase().includes(this._value.toLowerCase())
      )
      .slice(0, 10); // Limit to 10 suggestions
  }

  selectIngredient(ingredient: string): void {
    this._value = ingredient;
    this.onChange(this._value);
    this.valueChange.emit(this._value);
    this.showSuggestions = false;
    this.showAddButton = false;
  }

  addNewIngredientToList(): void {
    if (this._value.trim().length > 0) {
      this.addNewIngredient.emit(this._value.trim());
      this.showAddButton = false;
      this.showSuggestions = false;
    }
  }

  onBlur(): void {
    this.onTouched();
    // Delay hiding suggestions to allow for clicks on suggestions
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  onFocus(): void {
    if (this._value.length > 0) {
      this.filterIngredients();
      this.showSuggestions = true;
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this._value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
