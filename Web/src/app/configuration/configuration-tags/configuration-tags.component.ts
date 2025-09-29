import { Component, OnInit } from '@angular/core';
import { ConfigurationTabComponent, ConfigurationItem } from '../shared/configuration-tab.component';

@Component({
  selector: 'app-configuration-tags',
  standalone: true,
  imports: [ConfigurationTabComponent],
  templateUrl: './configuration-tags.component.html',
  styleUrl: './configuration-tags.component.scss'
})
export class ConfigurationTagsComponent implements OnInit {
  tags: ConfigurationItem[] = [
    { id: '1', value: 'Vegetarian' },
    { id: '2', value: 'Quick & Easy' },
    { id: '3', value: 'Healthy' },
    { id: '4', value: 'Comfort Food' },
    { id: '5', value: 'Gluten-Free' }
  ];

  private nextId = 6;

  ngOnInit(): void {
    // Initialize with sample data or load from service later
  }

  onTagAdded(value: string): void {
    const newTag: ConfigurationItem = {
      id: this.nextId.toString(),
      value: value.trim()
    };
    this.tags.push(newTag);
    this.nextId++;
    console.log('Tag added:', newTag);
  }

  onTagDeleted(id: string): void {
    this.tags = this.tags.filter(tag => tag.id !== id);
    console.log('Tag deleted:', id);
  }
}
