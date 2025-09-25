import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface GroceryShoppingDialogConfig {
  isVisible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GroceryShoppingDialogService {
  private dialogState = new BehaviorSubject<GroceryShoppingDialogConfig>({
    isVisible: false
  });

  public dialogState$ = this.dialogState.asObservable();

  openGroceryShoppingDialog(): void {
    this.dialogState.next({ isVisible: true });
  }

  closeGroceryShoppingDialog(): void {
    this.dialogState.next({ isVisible: false });
  }
}
