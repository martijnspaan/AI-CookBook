import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-multi-select-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './multi-select-dropdown.component.html',
  styleUrl: './multi-select-dropdown.component.scss'
})
export class MultiSelectDropdownComponent implements OnInit, OnDestroy, OnChanges {
  @Input() options: MultiSelectOption[] = [];
  @Input() selectedValues: string[] = [];
  @Input() placeholder: string = 'Select options';
  @Input() disabled: boolean = false;
  @Input() maxHeight: string = '200px';
  @Output() selectionChanged = new EventEmitter<string[]>();

  isOpen = false;
  filteredOptions: MultiSelectOption[] = [];
  searchTerm = '';

  ngOnInit(): void {
    this.filteredOptions = [...this.options];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options']) {
      this.filteredOptions = [...this.options];
    }
  }

  ngOnDestroy(): void {
    // Clean up any subscriptions if needed
  }

  toggleDropdown(): void {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.searchTerm = '';
      this.filteredOptions = [...this.options];
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
    this.searchTerm = '';
    this.filteredOptions = [...this.options];
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value.toLowerCase();
    
    this.filteredOptions = this.options.filter(option =>
      option.label.toLowerCase().includes(this.searchTerm)
    );
  }

  toggleSelection(option: MultiSelectOption): void {
    if (option.disabled) return;

    const index = this.selectedValues.indexOf(option.value);
    if (index > -1) {
      this.selectedValues.splice(index, 1);
    } else {
      this.selectedValues.push(option.value);
    }

    this.selectionChanged.emit([...this.selectedValues]);
  }

  isSelected(option: MultiSelectOption): boolean {
    return this.selectedValues.includes(option.value);
  }

  clearSelection(): void {
    this.selectedValues = [];
    this.selectionChanged.emit([]);
  }


  getDisplayText(): string {
    if (this.selectedValues.length === 0) {
      return this.placeholder;
    } else if (this.selectedValues.length === 1) {
      const selectedOption = this.options.find(option => option.value === this.selectedValues[0]);
      return selectedOption ? selectedOption.label : this.placeholder;
    } else {
      return `${this.selectedValues.length} items selected`;
    }
  }

  getSelectedLabels(): string[] {
    return this.selectedValues
      .map(value => this.options.find(option => option.value === value))
      .filter(option => option !== undefined)
      .map(option => option!.label);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.multi-select-dropdown')) {
      this.closeDropdown();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeDropdown();
    }
  }

  onOptionKeyDown(event: KeyboardEvent, option: MultiSelectOption): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleSelection(option);
    }
  }

}
