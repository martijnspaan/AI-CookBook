import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HamburgerMenuComponent } from './hamburger-menu/hamburger-menu.component';
import { FooterComponent } from './footer/footer.component';
import { PageTitleService } from './services/page-title.service';
import { CookbookModalService } from './services/cookbook-modal.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HamburgerMenuComponent, FooterComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  readonly applicationTitle = 'AI Cookbook';
  currentPageTitle = 'AI Cookbook';
  
  showFooterButton = false;
  footerButtonText = '';
  footerButtonIcon = '';
  footerButtonClass = 'btn-primary';
  private footerButtonClickHandler: (() => void) | null = null;

  constructor(
    private pageTitleService: PageTitleService,
    private router: Router,
    private cookbookModalService: CookbookModalService
  ) {}

  ngOnInit(): void {
    this.pageTitleService.pageTitle$.subscribe(title => {
      // Use setTimeout to defer the update to the next change detection cycle
      setTimeout(() => {
        this.currentPageTitle = title;
      }, 0);
    });
    
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateFooterForCurrentRoute();
      });
    
    this.updateFooterForCurrentRoute();
  }
  
  private updateFooterForCurrentRoute(): void {
    const currentUrl = this.router.url;
    
    if (currentUrl === '/recipes') {
      this.showFooterButton = true;
      this.footerButtonText = 'Create New Recipe';
      this.footerButtonIcon = 'fas fa-plus';
      this.footerButtonClass = 'btn-primary';
      this.footerButtonClickHandler = () => this.openCreateRecipeModal();
    } else if (currentUrl === '/week-menu') {
      this.showFooterButton = true;
      this.footerButtonText = 'Create Groceries List';
      this.footerButtonIcon = 'fas fa-shopping-cart';
      this.footerButtonClass = 'btn-success';
      this.footerButtonClickHandler = () => this.createGroceriesList();
    } else if (currentUrl === '/cookbooks') {
      this.showFooterButton = true;
      this.footerButtonText = 'Create New Cookbook';
      this.footerButtonIcon = 'fas fa-plus';
      this.footerButtonClass = 'btn-primary';
      this.footerButtonClickHandler = () => this.openCreateCookbookModal();
    } else {
      this.showFooterButton = false;
      this.footerButtonText = '';
      this.footerButtonIcon = '';
      this.footerButtonClass = 'btn-primary';
      this.footerButtonClickHandler = null;
    }
  }
  
  onFooterButtonClick(): void {
    if (this.footerButtonClickHandler) {
      this.footerButtonClickHandler();
    }
  }
  
  private openCreateRecipeModal(): void {
    const recipesComponent = this.getRecipesComponent();
    if (recipesComponent) {
      recipesComponent.openCreateRecipeModal();
    }
  }
  
  private getRecipesComponent(): any {
    const routerOutlet = document.querySelector('router-outlet');
    if (routerOutlet) {
      const componentRef = (routerOutlet as any).componentRef;
      if (componentRef && componentRef.instance) {
        return componentRef.instance;
      }
    }
    return null;
  }
  
  private createGroceriesList(): void {
    // TODO: Implement groceries list creation functionality
    console.log('Create groceries list functionality not yet implemented');
  }
  
  private openCreateCookbookModal(): void {
    this.cookbookModalService.openCreateCookbookModal();
  }
}
