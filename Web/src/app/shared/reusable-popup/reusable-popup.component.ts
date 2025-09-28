import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PopupConfig {
  title: string;
  showCloseButton?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  height?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showBackdrop?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

@Component({
  selector: 'app-reusable-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reusable-popup.component.html',
  styleUrl: './reusable-popup.component.scss',
  host: {
    '[class.popup-visible]': 'isVisible'
  }
})
export class ReusablePopupComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isVisible: boolean = false;
  @Input() config: PopupConfig = {
    title: 'Popup',
    showCloseButton: true,
    size: 'md',
    height: 'lg',
    showBackdrop: true,
    closeOnBackdropClick: true,
    closeOnEscape: true
  };
  @Output() popupClosed = new EventEmitter<void>();

  @ContentChild('popupHeader', { static: false }) headerTemplate?: TemplateRef<any>;
  @ContentChild('popupBody', { static: false }) bodyTemplate?: TemplateRef<any>;
  @ContentChild('popupFooter', { static: false }) footerTemplate?: TemplateRef<any>;

  ngOnInit(): void {
    if (this.isVisible) {
      this.addEscapeListener();
    }
  }

  ngOnDestroy(): void {
    this.removeEscapeListener();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible']) {
      if (this.isVisible) {
        this.addEscapeListener();
      } else {
        this.removeEscapeListener();
      }
    }
  }

  closePopup(): void {
    this.popupClosed.emit();
  }

  onBackdropClick(event: Event): void {
    if (this.config.closeOnBackdropClick && event.target === event.currentTarget) {
      this.closePopup();
    }
  }

  private addEscapeListener(): void {
    if (this.config.closeOnEscape) {
      document.addEventListener('keydown', this.escapeKeyHandler);
    }
  }

  private removeEscapeListener(): void {
    document.removeEventListener('keydown', this.escapeKeyHandler);
  }

  private escapeKeyHandler = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.isVisible) {
      this.closePopup();
    }
  };

  get sizeClass(): string {
    const sizeMap = {
      'sm': 'popup-sm',
      'md': 'popup-md', 
      'lg': 'popup-lg',
      'xl': 'popup-xl'
    };
    return sizeMap[this.config.size || 'md'];
  }

  get heightClass(): string {
    const heightMap = {
      'sm': 'popup-height-sm',
      'md': 'popup-height-md',
      'lg': 'popup-height-lg', 
      'xl': 'popup-height-xl',
      'full': 'popup-height-full'
    };
    return heightMap[this.config.height || 'lg'];
  }
}
