import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HamburgerMenuComponent } from './hamburger-menu/hamburger-menu.component';
import { FooterComponent } from './footer/footer.component';
import { RecipeSelectionDialogComponent } from './week-menu/recipe-selection-dialog/recipe-selection-dialog.component';
import { PageTitleService } from './services/page-title.service';
import { CookbookModalService } from './services/cookbook-modal.service';
import { RecipeModalService } from './services/recipe-modal.service';
import { GroceryShoppingDialogService } from './services/grocery-shopping-dialog.service';
import { RecipeSelectionDialogService, RecipeSelectionDialogData } from './services/recipe-selection-dialog.service';
import { FooterService, FooterButtonConfig } from './services/footer.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Recipe } from './models/recipe.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HamburgerMenuComponent, FooterComponent, RecipeSelectionDialogComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  readonly applicationTitle = 'AI Cookbook';
  currentPageTitle = 'AI Cookbook';
  private readonly destroySubject = new Subject<void>();
  
  // Recipe selection dialog state
  recipeDialogState: RecipeSelectionDialogData = {
    isVisible: false,
    selectedMealType: null,
    selectedDate: null,
    currentRecipe: null
  };
  
  // Footer button configuration
  showLeftButton = false;
  leftButtonText = '';
  leftButtonIcon = '';
  leftButtonClass = 'btn-outline-secondary';
  private leftButtonClickHandler: (() => void) | null = null;

  showRightButton = false;
  rightButtonText = '';
  rightButtonIcon = '';
  rightButtonClass = 'btn-primary';
  private rightButtonClickHandler: (() => void) | null = null;

  // Legacy single button support (deprecated)
  showFooterButton = false;
  footerButtonText = '';
  footerButtonIcon = '';
  footerButtonClass = 'btn-primary';
  private footerButtonClickHandler: (() => void) | null = null;

  constructor(
    private pageTitleService: PageTitleService,
    private router: Router,
    private cookbookModalService: CookbookModalService,
    private recipeModalService: RecipeModalService,
    private groceryShoppingDialogService: GroceryShoppingDialogService,
    private recipeSelectionDialogService: RecipeSelectionDialogService,
    private footerService: FooterService
  ) {}

  ngOnInit(): void {
    this.pageTitleService.pageTitle$
      .pipe(takeUntil(this.destroySubject))
      .subscribe(title => {
        // Use setTimeout to defer the update to the next change detection cycle
        setTimeout(() => {
          this.currentPageTitle = title;
        }, 0);
      });
    
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroySubject)
      )
      .subscribe(() => {
        // Defer footer update to avoid change detection issues
        setTimeout(() => {
          this.updateFooterForCurrentRoute();
        }, 0);
      });
    
    // Subscribe to footer service changes
    this.footerService.footerConfig$
      .pipe(takeUntil(this.destroySubject))
      .subscribe(config => {
        this.updateFooterFromService(config);
      });
    
    // Subscribe to recipe selection dialog state
    this.recipeSelectionDialogService.dialogState$
      .pipe(takeUntil(this.destroySubject))
      .subscribe(state => {
        this.recipeDialogState = state;
      });
    
    // Defer initial footer update to avoid change detection issues
    setTimeout(() => {
      this.updateFooterForCurrentRoute();
    }, 0);
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }
  
  private updateFooterForCurrentRoute(): void {
    const currentUrl = this.router.url;
    
    // Only update footer for non-recipe-detail pages
    if (!currentUrl.startsWith('/recipes/')) {
      // Reset all button configurations
      this.resetFooterButtons();
      
      if (currentUrl === '/recipes') {
        this.showRightButton = true;
        this.rightButtonText = 'Create New Recipe';
        this.rightButtonIcon = 'fas fa-plus';
        this.rightButtonClass = 'btn-primary';
        this.rightButtonClickHandler = () => this.openCreateRecipeModal();
      } else if (currentUrl === '/week-menu') {
        this.showRightButton = true;
        this.rightButtonText = 'Create Groceries List';
        this.rightButtonIcon = 'fas fa-shopping-cart';
        this.rightButtonClass = 'btn-success';
        this.rightButtonClickHandler = () => this.createGroceriesList();
      } else if (currentUrl === '/cookbooks') {
        this.showRightButton = true;
        this.rightButtonText = 'Create New Cookbook';
        this.rightButtonIcon = 'fas fa-plus';
        this.rightButtonClass = 'btn-primary';
        this.rightButtonClickHandler = () => this.openCreateCookbookModal();
      }
    }
  }

  private updateFooterFromService(config: FooterButtonConfig): void {
    this.showLeftButton = config.showLeftButton;
    this.leftButtonText = config.leftButtonText;
    this.leftButtonIcon = config.leftButtonIcon;
    this.leftButtonClass = config.leftButtonClass;
    this.leftButtonClickHandler = config.leftButtonClickHandler;

    this.showRightButton = config.showRightButton;
    this.rightButtonText = config.rightButtonText;
    this.rightButtonIcon = config.rightButtonIcon;
    this.rightButtonClass = config.rightButtonClass;
    this.rightButtonClickHandler = config.rightButtonClickHandler;
  }

  private resetFooterButtons(): void {
    // Reset legacy single button
    this.showFooterButton = false;
    this.footerButtonText = '';
    this.footerButtonIcon = '';
    this.footerButtonClass = 'btn-primary';
    this.footerButtonClickHandler = null;

    // Reset new dual buttons
    this.showLeftButton = false;
    this.leftButtonText = '';
    this.leftButtonIcon = '';
    this.leftButtonClass = 'btn-outline-secondary';
    this.leftButtonClickHandler = null;

    this.showRightButton = false;
    this.rightButtonText = '';
    this.rightButtonIcon = '';
    this.rightButtonClass = 'btn-primary';
    this.rightButtonClickHandler = null;
  }
  
  onFooterButtonClick(): void {
    if (this.footerButtonClickHandler) {
      this.footerButtonClickHandler();
    }
  }

  onLeftButtonClick(): void {
    if (this.leftButtonClickHandler) {
      this.leftButtonClickHandler();
    }
  }

  onRightButtonClick(): void {
    if (this.rightButtonClickHandler) {
      this.rightButtonClickHandler();
    }
  }
  
  private openCreateRecipeModal(): void {
    this.recipeModalService.openCreateRecipeModal();
  }
  
  private createGroceriesList(): void {
    this.groceryShoppingDialogService.openGroceryShoppingDialog();
  }
  
  private openCreateCookbookModal(): void {
    this.cookbookModalService.openCreateCookbookModal();
  }
  
  // Recipe selection dialog event handlers
  onRecipeSelected(event: { recipe: Recipe; mealType: string }): void {
    // Forward the event to the week menu component through the service
    this.recipeSelectionDialogService.selectRecipe(event.recipe, event.mealType);
  }
  
  onRecipeRemoved(event: { mealType: string; date: Date }): void {
    // Forward the event to the week menu component through the service
    this.recipeSelectionDialogService.removeRecipe(event.mealType, event.date);
  }
  
  onRecipeDialogClosed(): void {
    // Forward the event to the week menu component through the service
    this.recipeSelectionDialogService.closeDialog();
  }
}
