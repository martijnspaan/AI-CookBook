import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly STORAGE_KEY = 'meal-week-planner-language';
  private readonly DEFAULT_LANGUAGE = 'en';
  private readonly SUPPORTED_LANGUAGES = ['en', 'nl'];
  
  private currentLanguageSubject = new BehaviorSubject<string>(this.DEFAULT_LANGUAGE);
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  constructor(private translate: TranslateService) {
    this.initializeLanguage();
  }

  private initializeLanguage(): void {
    // Try to get language from local storage
    const storedLanguage = this.getStoredLanguage();
    
    if (storedLanguage && this.isValidLanguage(storedLanguage)) {
      this.setLanguage(storedLanguage);
    } else {
      // Fallback to browser language or default
      const browserLanguage = this.getBrowserLanguage();
      this.setLanguage(browserLanguage);
    }
  }

  private getStoredLanguage(): string | null {
    try {
      return localStorage.getItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Could not access localStorage:', error);
      return null;
    }
  }

  private setStoredLanguage(language: string): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, language);
    } catch (error) {
      console.warn('Could not save language to localStorage:', error);
    }
  }

  private getBrowserLanguage(): string {
    const browserLang = navigator.language || navigator.languages?.[0] || this.DEFAULT_LANGUAGE;
    const langCode = browserLang.split('-')[0].toLowerCase();
    
    return this.isValidLanguage(langCode) ? langCode : this.DEFAULT_LANGUAGE;
  }

  private isValidLanguage(language: string): boolean {
    return this.SUPPORTED_LANGUAGES.includes(language);
  }

  setLanguage(language: string): void {
    if (!this.isValidLanguage(language)) {
      console.warn(`Unsupported language: ${language}. Falling back to default.`);
      language = this.DEFAULT_LANGUAGE;
    }

    // Update translation service
    this.translate.use(language);
    
    // Update current language
    this.currentLanguageSubject.next(language);
    
    // Persist to local storage
    this.setStoredLanguage(language);
  }

  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  getSupportedLanguages(): string[] {
    return [...this.SUPPORTED_LANGUAGES];
  }

  isLanguageSupported(language: string): boolean {
    return this.isValidLanguage(language);
  }
}
