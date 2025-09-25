import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-grocery-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grocery-list.component.html',
  styleUrl: './grocery-list.component.scss'
})
export class GroceryListComponent {
  readonly pageTitle = 'Grocery List';
}
