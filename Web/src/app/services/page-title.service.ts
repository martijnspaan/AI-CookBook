import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PageTitleService implements OnDestroy {
  private pageTitleSubject = new BehaviorSubject<string>('AI Cookbook');
  public pageTitle$ = this.pageTitleSubject.asObservable();
  
  private currentTranslationKey: string | null = null;
  private readonly destroySubject = new Subject<void>();

  constructor(private translate: TranslateService) {
    // Listen to language changes and re-translate the current page title
    this.translate.onLangChange
      .pipe(takeUntil(this.destroySubject))
      .subscribe(() => {
        if (this.currentTranslationKey) {
          this.pageTitleSubject.next(this.translate.instant(this.currentTranslationKey));
        }
      });
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  setPageTitle(title: string): void {
    this.currentTranslationKey = null; // Clear translation key for direct titles
    this.pageTitleSubject.next(title);
  }

  setPageTitleFromTranslation(translationKey: string): void {
    this.currentTranslationKey = translationKey;
    this.pageTitleSubject.next(this.translate.instant(translationKey));
  }

  getCurrentPageTitle(): string {
    return this.pageTitleSubject.value;
  }
}
