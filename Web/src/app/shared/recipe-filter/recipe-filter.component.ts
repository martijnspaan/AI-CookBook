import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MultiSelectDropdownComponent, MultiSelectOption } from '../multi-select-dropdown/multi-select-dropdown.component';
import { Recipe } from '../../models/recipe.model';
import { Cookbook } from '../../models/cookbook.model';

export interface RecipeFilterOptions {
  mealTypeOptions: MultiSelectOption[];
  cookbookOptions: MultiSelectOption[];
}

export interface RecipeFilterState {
  selectedMealTypeFilters: string[];
  selectedCookbookFilters: string[];
  searchQuery: string;
}

@Component({
  selector: 'app-recipe-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, MultiSelectDropdownComponent],
  templateUrl: './recipe-filter.component.html',
  styleUrl: './recipe-filter.component.scss'
})
export class RecipeFilterComponent implements OnInit, OnDestroy {
  @Input() options: RecipeFilterOptions = {
    mealTypeOptions: [],
    cookbookOptions: []
  };
  
  @Input() filterState: RecipeFilterState = {
    selectedMealTypeFilters: [],
    selectedCookbookFilters: [],
    searchQuery: ''
  };
  
  @Input() isLoading = false;
  @Input() showCookbookFilter = true;
  @Input() showMealTypeFilter = true;
  @Input() showSearchFilter = true;
  
  @Output() filterChanged = new EventEmitter<RecipeFilterState>();
  @Output() filtersCleared = new EventEmitter<void>();

  ngOnInit(): void {
    // Component initialization
  }

  ngOnDestroy(): void {
    // Clean up any subscriptions if needed
  }

  onMealTypeSelectionChanged(selectedValues: string[]): void {
    this.filterState.selectedMealTypeFilters = selectedValues;
    this.emitFilterChange();
  }

  onCookbookSelectionChanged(selectedValues: string[]): void {
    this.filterState.selectedCookbookFilters = selectedValues;
    this.emitFilterChange();
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.filterState.searchQuery = target.value;
    this.emitFilterChange();
  }


  clearFilters(): void {
    this.filterState = {
      selectedMealTypeFilters: [],
      selectedCookbookFilters: [],
      searchQuery: ''
    };
    this.filtersCleared.emit();
    this.emitFilterChange();
  }

  hasActiveFilters(): boolean {
    return this.filterState.selectedMealTypeFilters.length > 0 || 
           this.filterState.selectedCookbookFilters.length > 0 || 
           this.filterState.searchQuery.trim().length > 0;
  }


  private emitFilterChange(): void {
    this.filterChanged.emit({ ...this.filterState });
  }
}
