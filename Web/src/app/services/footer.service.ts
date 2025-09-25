import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface FooterButtonConfig {
  showLeftButton: boolean;
  leftButtonText: string;
  leftButtonIcon: string;
  leftButtonClass: string;
  leftButtonClickHandler: (() => void) | null;
  
  showRightButton: boolean;
  rightButtonText: string;
  rightButtonIcon: string;
  rightButtonClass: string;
  rightButtonClickHandler: (() => void) | null;
}

@Injectable({
  providedIn: 'root'
})
export class FooterService {
  private footerConfigSubject = new BehaviorSubject<FooterButtonConfig>({
    showLeftButton: false,
    leftButtonText: '',
    leftButtonIcon: '',
    leftButtonClass: 'btn-outline-secondary',
    leftButtonClickHandler: null,
    showRightButton: false,
    rightButtonText: '',
    rightButtonIcon: '',
    rightButtonClass: 'btn-primary',
    rightButtonClickHandler: null
  });

  public footerConfig$: Observable<FooterButtonConfig> = this.footerConfigSubject.asObservable();

  setFooterConfig(config: Partial<FooterButtonConfig>): void {
    const currentConfig = this.footerConfigSubject.value;
    const newConfig = { ...currentConfig, ...config };
    this.footerConfigSubject.next(newConfig);
  }

  resetFooterConfig(): void {
    this.footerConfigSubject.next({
      showLeftButton: false,
      leftButtonText: '',
      leftButtonIcon: '',
      leftButtonClass: 'btn-outline-secondary',
      leftButtonClickHandler: null,
      showRightButton: false,
      rightButtonText: '',
      rightButtonIcon: '',
      rightButtonClass: 'btn-primary',
      rightButtonClickHandler: null
    });
  }
}
