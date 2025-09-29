import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface RecipeSettings {
  id: string;
  tags: string[];
  ingredients: string[];
  units: string[];
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateRecipeSettingsRequest {
  tags: string[];
  ingredients: string[];
  units: string[];
  categories: string[];
}

@Injectable({
  providedIn: 'root'
})
export class RecipeSettingsService {
  private readonly apiBaseUrl = '/api/recipesettings';

  constructor(private readonly httpClient: HttpClient) { }

  getRecipeSettings(): Observable<RecipeSettings | null> {
    return this.httpClient.get<RecipeSettings | null>(this.apiBaseUrl).pipe(
      catchError(this.handleError)
    );
  }

  updateRecipeSettings(settings: UpdateRecipeSettingsRequest): Observable<RecipeSettings> {
    return this.httpClient.put<RecipeSettings>(this.apiBaseUrl, settings).pipe(
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
    
    console.error('Recipe settings service error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
