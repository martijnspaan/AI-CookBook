export interface WeekDay {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  breakfastRecipeId?: string;
  lunchRecipeId?: string;
  dinnerRecipeId?: string;
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
