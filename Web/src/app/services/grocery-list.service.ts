import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GroceryList, CreateGroceryListRequest, UpdateIngredientStateRequest } from '../models/grocery-list.model';

@Injectable({
  providedIn: 'root'
})
export class GroceryListService {
  private readonly apiBaseUrl = '/api/grocerylists';

  constructor(private readonly httpClient: HttpClient) { }

  getAllGroceryLists(): Observable<GroceryList[]> {
    return this.httpClient.get<GroceryList[]>(this.apiBaseUrl).pipe(
      catchError(this.handleError)
    );
  }

  getGroceryListById(groceryListId: string): Observable<GroceryList> {
    return this.httpClient.get<GroceryList>(`${this.apiBaseUrl}/${groceryListId}`).pipe(
      catchError(this.handleError)
    );
  }

  createGroceryList(groceryListRequest: CreateGroceryListRequest): Observable<GroceryList> {
    return this.httpClient.post<GroceryList>(this.apiBaseUrl, groceryListRequest).pipe(
      catchError(this.handleError)
    );
  }

  updateGroceryList(groceryListId: string, groceryListRequest: CreateGroceryListRequest): Observable<GroceryList> {
    return this.httpClient.put<GroceryList>(`${this.apiBaseUrl}/${groceryListId}`, groceryListRequest).pipe(
      catchError(this.handleError)
    );
  }

  deleteGroceryList(groceryListId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiBaseUrl}/${groceryListId}`).pipe(
      catchError(this.handleError)
    );
  }

  updateIngredientState(groceryListId: string, ingredientStateRequest: UpdateIngredientStateRequest): Observable<GroceryList> {
    return this.httpClient.patch<GroceryList>(`${this.apiBaseUrl}/${groceryListId}/ingredient-state`, ingredientStateRequest).pipe(
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
    
    console.error('Grocery list service error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
