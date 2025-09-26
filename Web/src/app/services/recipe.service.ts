import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Recipe, CreateRecipeRequest, UpdateRecipeRequest } from '../models/recipe.model';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private readonly apiBaseUrl = 'http://localhost:4201/api/recipes';

  constructor(private readonly httpClient: HttpClient) { }

  getAllRecipes(): Observable<Recipe[]> {
    return this.httpClient.get<Recipe[]>(this.apiBaseUrl).pipe(
      catchError(this.handleError)
    );
  }

  getRecipeById(recipeId: string): Observable<Recipe> {
    return this.httpClient.get<Recipe>(`${this.apiBaseUrl}/${recipeId}`).pipe(
      catchError(this.handleError)
    );
  }

  createNewRecipe(recipeRequest: CreateRecipeRequest): Observable<Recipe> {
    return this.httpClient.post<Recipe>(this.apiBaseUrl, recipeRequest).pipe(
      catchError(this.handleError)
    );
  }

  updateExistingRecipe(recipeId: string, recipeRequest: UpdateRecipeRequest): Observable<Recipe> {
    return this.httpClient.put<Recipe>(`${this.apiBaseUrl}/${recipeId}`, recipeRequest).pipe(
      catchError(this.handleError)
    );
  }

  deleteRecipeById(recipeId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiBaseUrl}/${recipeId}`).pipe(
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
    
    console.error('Recipe service error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
