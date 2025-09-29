import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageTitleService } from '../services/page-title.service';
import { ConfigurationTagsComponent } from './configuration-tags/configuration-tags.component';
import { ConfigurationIngredientsComponent } from './configuration-ingredients/configuration-ingredients.component';
import { ConfigurationUnitsComponent } from './configuration-units/configuration-units.component';
import { ConfigurationCategoriesComponent } from './configuration-categories/configuration-categories.component';

export interface AccordionSection {
  id: string;
  title: string;
  icon: string;
  content: string;
  expanded?: boolean;
}

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
  
  accordionSections: AccordionSection[] = [
    {
      id: 'tags',
      title: 'Recipe Tags',
      icon: 'fas fa-tags',
      content: '',
      expanded: false
    },
    {
      id: 'ingredients',
      title: 'Ingredients',
      icon: 'fas fa-carrot',
      content: '',
      expanded: false
    },
    {
      id: 'units',
      title: 'Measurement Units',
      icon: 'fas fa-weight',
      content: '',
      expanded: false
    },
    {
      id: 'categories',
      title: 'Ingredient Categories',
      icon: 'fas fa-utensils',
      content: '',
      expanded: false
    }
  ];

  constructor(private readonly pageTitleService: PageTitleService) {}

  ngOnInit(): void {
    this.pageTitleService.setPageTitle('Recipe Settings');
  }

  toggleSection(sectionId: string): void {
    if (this.expandedSection === sectionId) {
      this.expandedSection = null;
    } else {
      this.expandedSection = sectionId as 'tags' | 'ingredients' | 'units' | 'categories';
    }
  }

  isExpanded(sectionId: string): boolean {
    return this.expandedSection === sectionId;
  }
}
