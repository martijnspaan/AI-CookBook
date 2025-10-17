import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Recipe } from '../../models/recipe.model';

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
  servingCount?: number;
}

@Component({
  selector: 'app-week-calendar',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './week-calendar.component.html',
  styleUrl: './week-calendar.component.scss'
})
export class WeekCalendarComponent implements AfterViewInit, OnChanges {
  @Input() selectedWeek: Date = new Date();
  @Input() recipeAssignments: RecipeAssignment[] = [];
  @Input() selectedMealSlot: { mealType: 'breakfast' | 'lunch' | 'dinner'; date: Date } | null = null;
  @Output() weekChanged = new EventEmitter<Date>();
  @Output() mealSlotClicked = new EventEmitter<{ mealType: 'breakfast' | 'lunch' | 'dinner'; date: Date }>();
  @Output() recipeDropped = new EventEmitter<{ recipe: Recipe; mealType: 'breakfast' | 'lunch' | 'dinner'; date: Date }>();
  @Output() recipeRemoved = new EventEmitter<{ mealType: 'breakfast' | 'lunch' | 'dinner'; date: Date }>();
  @Output() servingCountChanged = new EventEmitter<{ mealType: 'breakfast' | 'lunch' | 'dinner'; date: Date; servingCount: number }>();

  @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef;

  currentWeek: WeekDate[] = [];
  allDays: WeekDate[] = [];
  private readonly DAYS_TO_SHOW = 14; // Show 14 days starting from current day
  mealSlots: MealSlot[] = [];
  servingCountOptions: number[] = Array.from({ length: 8 }, (_, i) => i + 1);
  
  // Drag highlighting properties
  isDragActive = false;
  dragOverMealSlot: { mealType: 'breakfast' | 'lunch' | 'dinner'; date: Date } | null = null;

  constructor(private readonly translate: TranslateService) {
    this.initializeMealSlots();
  }

  private initializeMealSlots(): void {
    this.mealSlots = [
      { type: 'breakfast', label: this.translate.instant('MEAL_TYPES.BREAKFAST') },
      { type: 'lunch', label: this.translate.instant('MEAL_TYPES.LUNCH') },
      { type: 'dinner', label: this.translate.instant('MEAL_TYPES.DINNER') }
    ];
  }

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
    this.setupGlobalDragListeners();
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
        month: date.toLocaleDateString('en-US', { month: 'long' }),
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
        month: date.toLocaleDateString('en-US', { month: 'long' }),
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
    const dateString = this.formatDateAsString(date);
    const assignment = this.recipeAssignments.find(
      assignment => assignment.date === dateString && assignment.mealType === mealType
    );
    return assignment ? assignment.recipeTitle : null;
  }

  private formatDateAsString(date: Date): string {
    // Format date as YYYY-MM-DD without timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  isMealSlotSelected(date: Date, mealType: 'breakfast' | 'lunch' | 'dinner'): boolean {
    if (!this.selectedMealSlot) return false;
    return this.selectedMealSlot.date.toDateString() === date.toDateString() && 
           this.selectedMealSlot.mealType === mealType;
  }

  private setupGlobalDragListeners(): void {
    // Listen for drag start events to detect when a recipe is being dragged
    document.addEventListener('dragstart', (event) => {
      if (event.target && (event.target as HTMLElement).closest('.recipe-card')) {
        this.isDragActive = true;
      }
    });

    // Listen for drag end events to reset highlighting
    document.addEventListener('dragend', () => {
      this.isDragActive = false;
      this.dragOverMealSlot = null;
    });
  }

  onDragOver(event: DragEvent, mealType: 'breakfast' | 'lunch' | 'dinner', date: Date): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    
    // Set the current drag over meal slot for highlighting
    if (this.isDragActive) {
      this.dragOverMealSlot = { mealType, date };
    }
  }

  onDragLeave(event: DragEvent): void {
    // Only clear if we're leaving the meal slot area entirely
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (!relatedTarget || !relatedTarget.closest('.meal-slot')) {
      this.dragOverMealSlot = null;
    }
  }

  onDrop(event: DragEvent, mealType: 'breakfast' | 'lunch' | 'dinner', date: Date): void {
    event.preventDefault();
    
    // Reset drag state
    this.isDragActive = false;
    this.dragOverMealSlot = null;
    
    try {
      const recipeData = event.dataTransfer!.getData('application/json');
      const recipe: Recipe = JSON.parse(recipeData);
      
      this.recipeDropped.emit({
        recipe: recipe,
        mealType: mealType,
        date: date
      });
    } catch (error) {
      console.error('Error parsing dropped recipe data:', error);
    }
  }

  isMealSlotDragOver(mealType: 'breakfast' | 'lunch' | 'dinner', date: Date): boolean {
    return this.isDragActive && 
           this.dragOverMealSlot !== null &&
           this.dragOverMealSlot.mealType === mealType &&
           this.dragOverMealSlot.date.toDateString() === date.toDateString();
  }

  removeRecipeFromSlot(mealType: 'breakfast' | 'lunch' | 'dinner', date: Date): void {
    this.recipeRemoved.emit({
      mealType: mealType,
      date: date
    });
  }

  getServingCountForMealSlot(date: Date, mealType: 'breakfast' | 'lunch' | 'dinner'): number {
    const dateString = this.formatDateAsString(date);
    const assignment = this.recipeAssignments.find(a => 
      a.date === dateString && a.mealType === mealType
    );
    return assignment?.servingCount || 2; // Default to 2 if not set
  }

  updateServingCount(date: Date, mealType: 'breakfast' | 'lunch' | 'dinner', event: Event): void {
    const target = event.target as HTMLSelectElement;
    const servingCount = parseInt(target.value, 10);
    
    if (servingCount && servingCount > 0) {
      // Use the same date formatting as the parent component
      const dateString = this.formatDateAsString(date);
      const assignment = this.recipeAssignments.find(a => 
        a.date === dateString && a.mealType === mealType
      );
      
      if (assignment) {
        assignment.servingCount = servingCount;
        // Emit event to save changes to database
        this.servingCountChanged.emit({
          mealType: mealType,
          date: date,
          servingCount: servingCount
        });
      }
    }
  }
}
