import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageTitleService } from '../services/page-title.service';
import { ConfigurationTagsComponent } from './configuration-tags/configuration-tags.component';
import { ConfigurationIngredientsComponent } from './configuration-ingredients/configuration-ingredients.component';
import { ConfigurationUnitsComponent } from './configuration-units/configuration-units.component';
import { ConfigurationCategoriesComponent } from './configuration-categories/configuration-categories.component';

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [
    CommonModule,
    ConfigurationTagsComponent,
    ConfigurationIngredientsComponent,
    ConfigurationUnitsComponent,
    ConfigurationCategoriesComponent
  ],
  templateUrl: './configuration.component.html',
  styleUrl: './configuration.component.scss'
})
export class ConfigurationComponent implements OnInit {
  expandedSection: 'tags' | 'ingredients' | 'units' | 'categories' | null = null;
  sections: ('tags' | 'ingredients' | 'units' | 'categories')[] = ['tags', 'ingredients', 'units', 'categories'];

  constructor(private readonly pageTitleService: PageTitleService) {}

  ngOnInit(): void {
    this.pageTitleService.setPageTitle('Recipe Settings');
    // Ensure all sections are collapsed when component initializes
    this.expandedSection = null;
  }

  toggleSection(section: 'tags' | 'ingredients' | 'units' | 'categories'): void {
    this.expandedSection = this.expandedSection === section ? null : section;
  }

  isExpanded(section: 'tags' | 'ingredients' | 'units' | 'categories'): boolean {
    return this.expandedSection === section;
  }

  getSectionIcon(section: string): string {
    switch (section) {
      case 'tags': return 'fas fa-tags';
      case 'ingredients': return 'fas fa-carrot';
      case 'units': return 'fas fa-weight';
      case 'categories': return 'fas fa-utensils';
      default: return 'fas fa-cog';
    }
  }

  getSectionTitle(section: string): string {
    switch (section) {
      case 'tags': return 'Recipe Tags';
      case 'ingredients': return 'Ingredients';
      case 'units': return 'Measurement Units';
      case 'categories': return 'Ingredient Categories';
      default: return 'Configuration';
    }
  }

  getSectionDescription(section: string): string {
    switch (section) {
      case 'tags': return 'Manage tags for categorizing and filtering recipes';
      case 'ingredients': return 'Manage common ingredients for recipe creation';
      case 'units': return 'Manage measurement units for recipe ingredients';
      case 'categories': return 'Manage recipe categories for organization';
      default: return 'Configuration section';
    }
  }
}
