import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { 
  WeekMenu, 
  CreateOrUpdateWeekMenuRequest, 
  CreateOrUpdateWeekMenuResponse, 
  GetWeekMenusResponse 
} from '../models/week-menu.model';

@Injectable({
  providedIn: 'root'
})
export class WeekMenuService {
  private readonly apiBaseUrl = 'http://localhost:4201/api/weekmenus';

  constructor(private readonly httpClient: HttpClient) { }

  createOrUpdateWeekMenu(request: CreateOrUpdateWeekMenuRequest): Observable<CreateOrUpdateWeekMenuResponse> {
    return this.httpClient.post<CreateOrUpdateWeekMenuResponse>(this.apiBaseUrl, request).pipe(
      catchError(this.handleError)
    );
  }

  getWeekMenus(): Observable<WeekMenu[]> {
    return this.httpClient.get<WeekMenu[]>(this.apiBaseUrl).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      errorMessage = `Server error: ${error.status} - ${error.message}`;
    }
    
    console.error('WeekMenu service error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
