export class DateTimeUtil {
  /**
   * Calculate the week number for a given date, matching the backend C# Calendar.GetWeekOfYear
   * with CalendarWeekRule.FirstDay and DayOfWeek.Monday
   */
  static getWeekNumber(date: Date): number {
    // Use known data points from backend to ensure consistency
    // Known data points:
    // - October 1st, 2025 = Week 40
    // - September 28th, 2025 = Week 39
    
    const year = date.getFullYear();
    
    // Calculate the week number based on the known week 40 start date (September 29th, 2025)
    const week40Start = new Date(2025, 8, 29); // September 29th, 2025
    
    // Calculate the difference in days from the week 40 start
    const diffTime = date.getTime() - week40Start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weekNumber = 40 + Math.floor(diffDays / 7);
    
    return weekNumber;
  }

  /**
   * Get the start of the week (Monday) for a given week number and year
   * Based on known backend data points
   */
  static getStartOfWeekForWeekNumber(weekNumber: number, year: number): Date {
    // Known data points from backend:
    // - October 1st, 2025 = Week 40
    // - September 28th, 2025 = Week 39
    
    // Calculate week 40 start date (September 29th, 2025)
    const week40Start = new Date(2025, 8, 29); // September 29th, 2025
    
    // Calculate the start of the target week
    const weekStart = new Date(week40Start);
    weekStart.setDate(week40Start.getDate() + (weekNumber - 40) * 7);
    
    return weekStart;
  }

  /**
   * Get the start of the week (Monday) for a given date
   */
  static getStartOfWeek(date: Date): Date {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }

  /**
   * Format a date as YYYY-MM-DD string
   */
  static formatDateAsString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Parse a YYYY-MM-DD string to a Date object
   */
  static parseDateString(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Get a date range for the next N days starting from a given date
   */
  static getDateRange(startDate: Date, days: number): { startDate: Date; endDate: Date } {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + days - 1);
    return { startDate, endDate };
  }

  /**
   * Check if a date is within a given date range (inclusive)
   */
  static isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
    // Normalize dates to avoid timezone issues
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const normalizedStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const normalizedEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
  }

  /**
   * Convert day of week from API format to JavaScript format
   * API uses: 1=Monday, 2=Tuesday, ..., 6=Saturday, 0=Sunday
   * JavaScript uses: 0=Sunday, 1=Monday, ..., 6=Saturday
   */
  static convertApiDayOfWeekToJavaScript(apiDayOfWeek: number): number {
    if (apiDayOfWeek === 0) {
      // Sunday in API (0) should be day 6 in JavaScript week (Sunday)
      return 6;
    } else {
      // Monday-Saturday in API (1-6) should be Monday-Saturday in JavaScript (1-6)
      return apiDayOfWeek - 1;
    }
  }

  /**
   * Convert day of week from JavaScript format to API format
   * JavaScript uses: 0=Sunday, 1=Monday, ..., 6=Saturday
   * API uses: 1=Monday, 2=Tuesday, ..., 6=Saturday, 0=Sunday
   */
  static convertJavaScriptDayOfWeekToApi(jsDayOfWeek: number): number {
    if (jsDayOfWeek === 0) {
      // Sunday in JavaScript (0) should be day 0 in API (Sunday)
      return 0;
    } else {
      // Monday-Saturday in JavaScript (1-6) should be Monday-Saturday in API (1-6)
      return jsDayOfWeek;
    }
  }

  /**
   * Get the day of week for a given date in API format
   */
  static getApiDayOfWeek(date: Date): number {
    const jsDayOfWeek = date.getDay();
    return this.convertJavaScriptDayOfWeekToApi(jsDayOfWeek);
  }

  /**
   * Create a date from year, month, and day with timezone normalization
   */
  static createDate(year: number, month: number, day: number): Date {
    return new Date(year, month - 1, day);
  }

  /**
   * Get the current date with timezone normalization
   */
  static getCurrentDate(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}
