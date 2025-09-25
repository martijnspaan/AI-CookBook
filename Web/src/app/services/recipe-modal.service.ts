import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecipeModalService {
  private openModalSubject = new Subject<void>();
  
  openModal$ = this.openModalSubject.asObservable();
  
  openCreateRecipeModal(): void {
    this.openModalSubject.next();
  }
}
