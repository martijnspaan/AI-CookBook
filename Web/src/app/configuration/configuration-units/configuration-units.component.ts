import { Component, OnInit } from '@angular/core';
import { ConfigurationTabComponent, ConfigurationItem } from '../shared/configuration-tab.component';

@Component({
  selector: 'app-configuration-units',
  standalone: true,
  imports: [ConfigurationTabComponent],
  templateUrl: './configuration-units.component.html',
  styleUrl: './configuration-units.component.scss'
})
export class ConfigurationUnitsComponent implements OnInit {
  units: ConfigurationItem[] = [
    { id: '1', value: 'cup' },
    { id: '2', value: 'tablespoon' },
    { id: '3', value: 'teaspoon' },
    { id: '4', value: 'pound' },
    { id: '5', value: 'ounce' },
    { id: '6', value: 'gram' },
    { id: '7', value: 'kilogram' },
    { id: '8', value: 'liter' },
    { id: '9', value: 'milliliter' },
    { id: '10', value: 'piece' }
  ];

  private nextId = 11;

  ngOnInit(): void {
    // Initialize with sample data or load from service later
  }

  onUnitAdded(value: string): void {
    const newUnit: ConfigurationItem = {
      id: this.nextId.toString(),
      value: value.trim().toLowerCase()
    };
    this.units.push(newUnit);
    this.nextId++;
    console.log('Unit added:', newUnit);
  }

  onUnitDeleted(id: string): void {
    this.units = this.units.filter(unit => unit.id !== id);
    console.log('Unit deleted:', id);
  }
}
