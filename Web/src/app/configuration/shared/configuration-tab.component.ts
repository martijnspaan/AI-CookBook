import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

export interface ConfigurationItem {
  id: string;
  value: string;
}

@Component({
  selector: 'app-configuration-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './configuration-tab.component.html',
  styleUrl: './configuration-tab.component.scss'
})
export class ConfigurationTabComponent {
  @Input() items: ConfigurationItem[] = [];
  @Input() title: string = '';
  @Input() placeholder: string = 'Enter new item';
  @Input() emptyMessage: string = 'No items available. Add your first item below.';
  
  @Output() itemAdded = new EventEmitter<string>();
  @Output() itemDeleted = new EventEmitter<string>();

  itemForm: FormGroup;

  constructor(private readonly formBuilder: FormBuilder) {
    this.itemForm = this.formBuilder.group({
      value: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]]
    });
  }

  get sortedItems(): ConfigurationItem[] {
    return [...this.items].sort((a, b) => a.value.localeCompare(b.value));
  }

  onSubmit(): void {
    if (this.itemForm.valid) {
      const value = this.itemForm.get('value')?.value?.trim();
      if (value) {
        this.itemAdded.emit(value);
        this.itemForm.reset();
      }
    }
  }

  deleteItem(item: ConfigurationItem): void {
    this.itemDeleted.emit(item.id);
  }

  getButtonText(): string {
    return 'Add';
  }

  getButtonIcon(): string {
    return 'fas fa-plus';
  }
}
