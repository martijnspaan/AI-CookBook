import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageTitleService } from '../services/page-title.service';
import { GroceryListService } from '../services/grocery-list.service';
import { GroceryList } from '../models/grocery-list.model';

@Component({
  selector: 'app-grocery-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grocery-list.component.html',
  styleUrl: './grocery-list.component.scss'
})
export class GroceryListComponent implements OnInit, AfterViewInit {
  groceryLists: GroceryList[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;

  constructor(
    private pageTitleService: PageTitleService,
    private groceryListService: GroceryListService
  ) {}

  ngOnInit(): void {
    this.loadGroceryLists();
  }

  ngAfterViewInit(): void {
    this.pageTitleService.setPageTitle('Grocery List');
  }

  private loadGroceryLists(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.groceryListService.getAllGroceryLists().subscribe({
      next: (groceryLists) => {
        this.groceryLists = groceryLists;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading grocery lists:', error);
        this.errorMessage = 'Failed to load grocery lists. Please try again.';
        this.isLoading = false;
      }
    });
  }

  refreshGroceryLists(): void {
    this.loadGroceryLists();
  }

  getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getMealTypeLabel(mealType: string): string {
    return mealType.charAt(0).toUpperCase() + mealType.slice(1);
  }

  getDayOfWeekLabel(dayOfMeal: string): string {
    return dayOfMeal.charAt(0).toUpperCase() + dayOfMeal.slice(1);
  }
}
