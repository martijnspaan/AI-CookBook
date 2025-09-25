import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  // Left Button Properties
  @Input() leftButtonText: string = '';
  @Input() leftButtonIcon: string = '';
  @Input() leftButtonClass: string = 'btn-outline-secondary';
  @Input() showLeftButton: boolean = false;
  @Output() leftButtonClick = new EventEmitter<void>();

  // Right Button Properties
  @Input() rightButtonText: string = '';
  @Input() rightButtonIcon: string = '';
  @Input() rightButtonClass: string = 'btn-primary';
  @Input() showRightButton: boolean = false;
  @Output() rightButtonClick = new EventEmitter<void>();

  // Legacy support for single button (deprecated)
  @Input() buttonText: string = '';
  @Input() buttonIcon: string = '';
  @Input() buttonClass: string = 'btn-primary';
  @Input() showButton: boolean = false;
  @Output() buttonClick = new EventEmitter<void>();

  onLeftButtonClick(): void {
    this.leftButtonClick.emit();
  }

  onRightButtonClick(): void {
    this.rightButtonClick.emit();
  }

  // Legacy support for single button (deprecated)
  onButtonClick(): void {
    this.buttonClick.emit();
  }
}
