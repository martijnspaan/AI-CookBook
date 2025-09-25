import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CookbookModalService {
  private openModalSubject = new Subject<void>();
  
  openModal$ = this.openModalSubject.asObservable();
  
  openCreateCookbookModal(): void {
    this.openModalSubject.next();
  }
}
