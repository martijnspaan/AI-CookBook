import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';

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

export interface FooterButtonTranslationConfig {
  showLeftButton: boolean;
  leftButtonTranslationKey: string;
  leftButtonIcon: string;
  leftButtonClass: string;
  leftButtonClickHandler: (() => void) | null;
  
  showRightButton: boolean;
  rightButtonTranslationKey: string;
  rightButtonIcon: string;
  rightButtonClass: string;
  rightButtonClickHandler: (() => void) | null;
}

@Injectable({
  providedIn: 'root'
})
export class FooterService implements OnDestroy {
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

  private currentTranslationConfig: FooterButtonTranslationConfig | null = null;
  private readonly destroySubject = new Subject<void>();

  public footerConfig$: Observable<FooterButtonConfig> = this.footerConfigSubject.asObservable();

  constructor(private translate: TranslateService) {
    // Listen to language changes and re-translate footer button texts
    this.translate.onLangChange
      .pipe(takeUntil(this.destroySubject))
      .subscribe(() => {
        if (this.currentTranslationConfig) {
          this.updateFooterFromTranslationConfig(this.currentTranslationConfig);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  setFooterConfig(config: Partial<FooterButtonConfig>): void {
    this.currentTranslationConfig = null; // Clear translation config for direct text
    const currentConfig = this.footerConfigSubject.value;
    const newConfig = { ...currentConfig, ...config };
    this.footerConfigSubject.next(newConfig);
  }

  setFooterConfigFromTranslation(config: FooterButtonTranslationConfig): void {
    this.currentTranslationConfig = config;
    this.updateFooterFromTranslationConfig(config);
  }

  private updateFooterFromTranslationConfig(config: FooterButtonTranslationConfig): void {
    const translatedConfig: FooterButtonConfig = {
      showLeftButton: config.showLeftButton,
      leftButtonText: config.leftButtonTranslationKey ? this.translate.instant(config.leftButtonTranslationKey) : '',
      leftButtonIcon: config.leftButtonIcon,
      leftButtonClass: config.leftButtonClass,
      leftButtonClickHandler: config.leftButtonClickHandler,
      showRightButton: config.showRightButton,
      rightButtonText: config.rightButtonTranslationKey ? this.translate.instant(config.rightButtonTranslationKey) : '',
      rightButtonIcon: config.rightButtonIcon,
      rightButtonClass: config.rightButtonClass,
      rightButtonClickHandler: config.rightButtonClickHandler
    };
    this.footerConfigSubject.next(translatedConfig);
  }

  resetFooterConfig(): void {
    this.currentTranslationConfig = null;
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
