import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface WeekDate {
  date: Date;
  dayName: string;
  dayNumber: number;
  month: string;
  isWeekend: boolean;
}

export interface MealSlot {
  type: 'breakfast' | 'lunch' | 'dinner';
  label: string;
  recipe?: string;
}

export interface RecipeAssignment {
  date: string; // ISO date string
  mealType: 'breakfast' | 'lunch' | 'dinner';
  recipeId: string;
  recipeTitle: string;
}

@Component({
  selector: 'app-week-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './week-calendar.component.html',
  styleUrl: './week-calendar.component.scss'
})
export class WeekCalendarComponent implements AfterViewInit, OnChanges {
  @Input() selectedWeek: Date = new Date();
  @Input() recipeAssignments: RecipeAssignment[] = [];
  @Input() selectedMealSlot: { mealType: 'breakfast' | 'lunch' | 'dinner'; date: Date } | null = null;
  @Output() weekChanged = new EventEmitter<Date>();
  @Output() mealSlotClicked = new EventEmitter<{ mealType: 'breakfast' | 'lunch' | 'dinner'; date: Date }>();

  @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef;

  currentWeek: WeekDate[] = [];
  allDays: WeekDate[] = [];
  private readonly DAYS_TO_SHOW = 14; // Show 14 days starting from current day
  mealSlots: MealSlot[] = [
    { type: 'breakfast', label: 'Breakfast' },
    { type: 'lunch', label: 'Lunch' },
    { type: 'dinner', label: 'Dinner' }
  ];

  ngOnInit() {
    this.generateAllDays();
  }

  ngAfterViewInit() {
    // Initialize scroll position to start at the top
    if (this.scrollContainer) {
      setTimeout(() => {
        this.scrollContainer.nativeElement.scrollTop = 0;
      }, 0);
    }
  }

  ngOnChanges() {
    this.generateAllDays();
  }

  private generateAllDays() {
    // Generate 14 days starting from current day
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    this.allDays = [];
    for (let i = 0; i < this.DAYS_TO_SHOW; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      this.allDays.push({
        date: date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        isWeekend: isWeekend
      });
    }
    
    // Update current week for compatibility with existing logic
    const currentWeekStart = this.getWeekStart(today);
    this.currentWeek = this.generateWeekDates(currentWeekStart);
  }



  private getWeekStart(date: Date): Date {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }

  private generateWeekDates(startDate: Date): WeekDate[] {
    const weekDates: WeekDate[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
      
      weekDates.push({
        date: date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        isWeekend: isWeekend
      });
    }

    return weekDates;
  }



  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  onMealSlotClick(mealType: 'breakfast' | 'lunch' | 'dinner', date: Date) {
    this.mealSlotClicked.emit({ mealType, date });
  }

  getRecipeForMealSlot(date: Date, mealType: 'breakfast' | 'lunch' | 'dinner'): string | null {
    const dateString = date.toISOString().split('T')[0];
    const assignment = this.recipeAssignments.find(
      assignment => assignment.date === dateString && assignment.mealType === mealType
    );
    return assignment ? assignment.recipeTitle : null;
  }

  isMealSlotSelected(date: Date, mealType: 'breakfast' | 'lunch' | 'dinner'): boolean {
    if (!this.selectedMealSlot) return false;
    return this.selectedMealSlot.date.toDateString() === date.toDateString() && 
           this.selectedMealSlot.mealType === mealType;
  }
}
