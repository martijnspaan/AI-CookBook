import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HamburgerMenuComponent } from './hamburger-menu/hamburger-menu.component';
import { FooterComponent } from './footer/footer.component';
import { RecipeSelectionDialogComponent } from './week-menu/recipe-selection-dialog/recipe-selection-dialog.component';
import { OfflineStatusComponent } from './shared/offline-status/offline-status.component';
import { PageTitleService } from './services/page-title.service';
import { CookbookModalService } from './services/cookbook-modal.service';
import { RecipeModalService } from './services/recipe-modal.service';
import { GroceryListDialogService } from './services/grocery-list-dialog.service';
import { RecipeSelectionDialogService, RecipeSelectionDialogData } from './services/recipe-selection-dialog.service';
import { FooterService, FooterButtonConfig } from './services/footer.service';
import { LanguageService } from './services/language.service';
import { PwaService } from './services/offline/pwa.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Recipe } from './models/recipe.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HamburgerMenuComponent, FooterComponent, RecipeSelectionDialogComponent, OfflineStatusComponent, CommonModule, TranslateModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  readonly applicationTitle = 'Meal Week Planner';
  currentPageTitle = '';
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

  // Computed property to determine if footer should be visible
  get shouldShowFooter(): boolean {
    return this.showLeftButton || this.showRightButton || this.showFooterButton;
  }

  constructor(
    private pageTitleService: PageTitleService,
    private router: Router,
    private cookbookModalService: CookbookModalService,
    private recipeModalService: RecipeModalService,
    private groceryListDialogService: GroceryListDialogService,
    private recipeSelectionDialogService: RecipeSelectionDialogService,
    private footerService: FooterService,
    private translate: TranslateService,
    private languageService: LanguageService,
    private pwaService: PwaService
  ) {}

  ngOnInit(): void {
    // Initialize language service first to restore user's language preference
    // The language service will automatically load the saved language from localStorage
    // and set it as the current language for the translation service
    
    // Expose PWA service to window for console access
    this.pwaService.exposeToWindow();
    
    // Set initial page title
    this.pageTitleService.setPageTitleFromTranslation('PAGE_TITLES.AI_COOKBOOK');
    
    // Listen to language changes and re-translate footer buttons
    this.translate.onLangChange
      .pipe(takeUntil(this.destroySubject))
      .subscribe(() => {
        this.updateFooterForCurrentRoute();
      });
    
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
    
    // Handle routes that should never show footer (recipe detail pages and showcase)
    if (currentUrl.startsWith('/recipes/') || currentUrl === '/showcase') {
      this.ensureFooterHidden();
      return;
    }
    
    // For grocery list detail pages, let the component control the footer via FooterService
    if (currentUrl.startsWith('/grocery-list/')) {
      // Don't override the footer service configuration for grocery list detail pages
      // The component will handle footer setup via FooterService
      return;
    }
    
    // Reset all button configurations first
    this.resetFooterButtons();
    
    // Configure footer buttons based on current route
    // Only these specific routes should show footer buttons:
    if (currentUrl === '/recipes') {
      this.showRightButton = true;
      this.rightButtonText = this.translate.instant('BUTTONS.NEW_RECIPE');
      this.rightButtonIcon = 'fas fa-plus';
      this.rightButtonClass = 'btn-primary';
      this.rightButtonClickHandler = () => this.openCreateRecipeModal();
    } else if (currentUrl === '/week-menu') {
      this.showRightButton = true;
      this.rightButtonText = this.translate.instant('BUTTONS.NEW_GROCERY_LIST');
      this.rightButtonIcon = 'fas fa-shopping-cart';
      this.rightButtonClass = 'btn-success';
      this.rightButtonClickHandler = () => this.createGroceryList();
    } else if (currentUrl === '/cookbooks') {
      this.showRightButton = true;
      this.rightButtonText = this.translate.instant('BUTTONS.NEW_COOKBOOK');
      this.rightButtonIcon = 'fas fa-plus';
      this.rightButtonClass = 'btn-primary';
      this.rightButtonClickHandler = () => this.openCreateCookbookModal();
    } else {
      // For all other routes (including /recipe-settings, /grocery-list), 
      // ensure footer is completely hidden
      this.ensureFooterHidden();
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

  // Helper method to ensure footer is completely hidden
  private ensureFooterHidden(): void {
    // Force reset all footer states to ensure clean state
    this.resetFooterButtons();
    
    // Also reset the footer service to prevent any lingering state
    this.footerService.resetFooterConfig();
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
  
  private createGroceryList(): void {
    this.groceryListDialogService.openGroceryListDialog();
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
