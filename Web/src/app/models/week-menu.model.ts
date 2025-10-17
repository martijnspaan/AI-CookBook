export interface WeekDay {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  breakfastRecipeId?: string;
  breakfastServingCount?: number;
  lunchRecipeId?: string;
  lunchServingCount?: number;
  dinnerRecipeId?: string;
  dinnerServingCount?: number;
}

export interface WeekMenu {
  id?: string;
  weekNumber: number;
  year: number;
  weekDays: WeekDay[];
}

export interface CreateOrUpdateWeekMenuRequest {
  weekNumber: number;
  year: number;
  weekDays: WeekDay[];
}

export interface CreateOrUpdateWeekMenuResponse {
  id: string;
  weekNumber: number;
  year: number;
  weekDays: WeekDay[];
}

export interface GetWeekMenusResponse {
  weekMenus: WeekMenu[];
}
