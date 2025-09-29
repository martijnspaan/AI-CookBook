import { Component, OnInit } from '@angular/core';
import { ConfigurationTabComponent, ConfigurationItem } from '../shared/configuration-tab.component';

@Component({
  selector: 'app-configuration-ingredients',
  standalone: true,
  imports: [ConfigurationTabComponent],
  templateUrl: './configuration-ingredients.component.html',
  styleUrl: './configuration-ingredients.component.scss'
})
export class ConfigurationIngredientsComponent implements OnInit {
  ingredients: ConfigurationItem[] = [
    { id: '1', value: 'Chicken Breast' },
    { id: '2', value: 'Olive Oil' },
    { id: '3', value: 'Salt' },
    { id: '4', value: 'Black Pepper' },
    { id: '5', value: 'Garlic' },
    { id: '6', value: 'Onion' },
    { id: '7', value: 'Tomatoes' },
    { id: '8', value: 'Basil' }
  ];

  private nextId = 9;

  ngOnInit(): void {
    // Initialize with sample data or load from service later
  }

  onIngredientAdded(value: string): void {
    const newIngredient: ConfigurationItem = {
      id: this.nextId.toString(),
      value: value.trim()
    };
    this.ingredients.push(newIngredient);
    this.nextId++;
    console.log('Ingredient added:', newIngredient);
  }

  onIngredientDeleted(id: string): void {
    this.ingredients = this.ingredients.filter(ingredient => ingredient.id !== id);
    console.log('Ingredient deleted:', id);
  }
}
