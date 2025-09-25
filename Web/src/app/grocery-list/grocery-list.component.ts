import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageTitleService } from '../services/page-title.service';

@Component({
  selector: 'app-grocery-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grocery-list.component.html',
  styleUrl: './grocery-list.component.scss'
})
export class GroceryListComponent implements OnInit, AfterViewInit {
  constructor(private pageTitleService: PageTitleService) {}

  ngOnInit(): void {
    // Component initialization logic can go here if needed
  }

  ngAfterViewInit(): void {
    this.pageTitleService.setPageTitle('Grocery List');
  }
}
