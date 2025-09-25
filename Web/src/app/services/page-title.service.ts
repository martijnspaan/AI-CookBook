import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PageTitleService {
  private pageTitleSubject = new BehaviorSubject<string>('AI Cookbook');
  public pageTitle$ = this.pageTitleSubject.asObservable();

  setPageTitle(title: string): void {
    this.pageTitleSubject.next(title);
  }

  getCurrentPageTitle(): string {
    return this.pageTitleSubject.value;
  }
}
