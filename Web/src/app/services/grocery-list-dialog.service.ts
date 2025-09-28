import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface GroceryListDialogConfig {
  isVisible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GroceryListDialogService {
  private dialogState = new BehaviorSubject<GroceryListDialogConfig>({
    isVisible: false
  });

  public dialogState$ = this.dialogState.asObservable();

  openGroceryListDialog(): void {
    this.dialogState.next({ isVisible: true });
  }

  closeGroceryListDialog(): void {
    this.dialogState.next({ isVisible: false });
  }
}
