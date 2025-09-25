import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Cookbook, CreateCookbookRequest, UpdateCookbookRequest } from '../models/cookbook.model';

@Injectable({
  providedIn: 'root'
})
export class CookbookService {
  private readonly apiBaseUrl = 'https://localhost:7149/api/cookbooks';

  constructor(private readonly httpClient: HttpClient) { }

  getAllCookbooks(): Observable<Cookbook[]> {
    return this.httpClient.get<Cookbook[]>(this.apiBaseUrl).pipe(
      catchError(this.handleError)
    );
  }

  getCookbookById(cookbookId: string): Observable<Cookbook> {
    return this.httpClient.get<Cookbook>(`${this.apiBaseUrl}/${cookbookId}`).pipe(
      catchError(this.handleError)
    );
  }

  createNewCookbook(cookbookRequest: CreateCookbookRequest): Observable<Cookbook> {
    return this.httpClient.post<Cookbook>(this.apiBaseUrl, cookbookRequest).pipe(
      catchError(this.handleError)
    );
  }

  updateExistingCookbook(cookbookId: string, cookbookRequest: UpdateCookbookRequest): Observable<Cookbook> {
    return this.httpClient.put<Cookbook>(`${this.apiBaseUrl}/${cookbookId}`, cookbookRequest).pipe(
      catchError(this.handleError)
    );
  }

  deleteCookbookById(cookbookId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiBaseUrl}/${cookbookId}`).pipe(
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
    
    console.error('Cookbook service error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
