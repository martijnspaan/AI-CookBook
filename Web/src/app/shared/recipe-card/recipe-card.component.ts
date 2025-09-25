import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CookbookService } from '../../services/cookbook.service';
import { Recipe } from '../../models/recipe.model';
import { Cookbook } from '../../models/cookbook.model';

@Component({
  selector: 'app-recipe-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipe-card.component.html',
  styleUrl: './recipe-card.component.scss'
})
export class RecipeCardComponent implements OnInit, OnDestroy {
  @Input() recipe!: Recipe;
  @Input() showDeleteButton: boolean = false;
  @Input() showDescription: boolean = true;
  @Input() compactMode: boolean = false;
  @Input() clickable: boolean = true;
  @Output() recipeClicked = new EventEmitter<Recipe>();
  @Output() deleteClicked = new EventEmitter<Recipe>();

  cookbooks: Cookbook[] = [];
  isLoadingCookbooks = false;
  private readonly destroySubject = new Subject<void>();

  constructor(private readonly cookbookService: CookbookService) {}

  ngOnInit(): void {
    this.loadAllCookbooks();
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  loadAllCookbooks(): void {
    this.isLoadingCookbooks = true;
    
    this.cookbookService.getAllCookbooks()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (cookbooks) => {
          this.cookbooks = cookbooks;
          this.isLoadingCookbooks = false;
        },
        error: (error) => {
          this.isLoadingCookbooks = false;
          console.error('Error loading cookbooks:', error);
        }
      });
  }

  getCookbookTitle(cookbookId?: string): string {
    if (!cookbookId) return 'No cookbook';
    const cookbook = this.cookbooks.find(cb => cb.id === cookbookId);
    return cookbook ? cookbook.title : 'Unknown cookbook';
  }

  onCardClick(): void {
    if (this.clickable) {
      this.recipeClicked.emit(this.recipe);
    }
  }

  onDeleteClick(event: Event): void {
    event.stopPropagation();
    this.deleteClicked.emit(this.recipe);
  }
}
