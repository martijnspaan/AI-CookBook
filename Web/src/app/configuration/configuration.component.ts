import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
    TranslateModule,
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
  
  accordionSections: AccordionSection[] = [];

  constructor(
    private readonly pageTitleService: PageTitleService,
    private readonly translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.pageTitleService.setPageTitle('Recipe Settings');

    this.updateAccordionSections();
  }

  private updateAccordionSections(): void {
    this.accordionSections = [
      {
        id: 'tags',
        title: this.translateService.instant('CONFIGURATION.RECIPE_TAGS'),
        icon: 'fas fa-tags',
        content: '',
        expanded: false
      },
      {
        id: 'ingredients',
        title: this.translateService.instant('CONFIGURATION.INGREDIENTS'),
        icon: 'fas fa-carrot',
        content: '',
        expanded: false
      },
      {
        id: 'units',
        title: this.translateService.instant('CONFIGURATION.MEASUREMENT_UNITS'),
        icon: 'fas fa-weight',
        content: '',
        expanded: false
      },
      {
        id: 'categories',
        title: this.translateService.instant('CONFIGURATION.INGREDIENT_CATEGORIES'),
        icon: 'fas fa-utensils',
        content: '',
        expanded: false
      }
    ];
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
