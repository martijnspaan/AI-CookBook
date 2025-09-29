import { Component, OnInit } from '@angular/core';
import { ConfigurationTabComponent, ConfigurationItem } from '../shared/configuration-tab.component';

@Component({
  selector: 'app-configuration-categories',
  standalone: true,
  imports: [ConfigurationTabComponent],
  templateUrl: './configuration-categories.component.html',
  styleUrl: './configuration-categories.component.scss'
})
export class ConfigurationCategoriesComponent implements OnInit {
  categories: ConfigurationItem[] = [
    { id: '1', value: 'Vegetables' },
    { id: '2', value: 'Meat' },
    { id: '3', value: 'Dairy' },
    { id: '4', value: 'Seasoning' },
    { id: '5', value: 'Grains' },
    { id: '6', value: 'Fruits' },
    { id: '7', value: 'Seafood' },
    { id: '8', value: 'Nuts' }
  ];

  private nextId = 9;

  ngOnInit(): void {
    // Initialize with sample data or load from service later
  }

  onCategoryAdded(value: string): void {
    const newCategory: ConfigurationItem = {
      id: this.nextId.toString(),
      value: value.trim()
    };
    this.categories.push(newCategory);
    this.nextId++;
    console.log('Category added:', newCategory);
  }

  onCategoryDeleted(id: string): void {
    this.categories = this.categories.filter(category => category.id !== id);
    console.log('Category deleted:', id);
  }
}
