import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '@env/environment';

export interface Category {
  id?: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/api/Category`; // Ensure this matches your backend controller route

  constructor(private http: HttpClient) { }

  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  addCategory(categoryName: string): Observable<Category> {
    const category: Category = { name: categoryName };
    return this.http.post<Category>(this.apiUrl, category).pipe(
      catchError(this.handleError)
    );
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> { // Explicitly define return type
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side errors
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Backend errors
      if (error.status === 409) { // Conflict
        // Backend now sends a specific message for "Category must be empty"
        // error.error might be a string or an object with a message property
        if (typeof error.error === 'string') {
          errorMessage = `Error: ${error.error}`;
        } else if (error.error && (error.error as any).message) {
          errorMessage = `Error: ${(error.error as any).message}`;
        } else {
          errorMessage = `Error: Category operation conflict.`; // Fallback message
        }
      } else if (error.status === 400) { // Bad Request
        errorMessage = `Error: ${typeof error.error === 'string' ? error.error : (error.error as any)?.message || 'Invalid request.'}`;
      } else if (error.status === 403) { // Forbidden
        errorMessage = `Error: You do not have permission to perform this action.`;
      } else if (error.error && typeof error.error === 'object' && (error.error as any).message) { // Generic error from backend with message
        errorMessage = `Error: ${(error.error as any).message}`;
      } else {
        errorMessage = `Server returned code: ${error.status}, error message: ${error.message}`;
      }
    }
    console.error(errorMessage, error); // Log both the constructed message and the raw error object
    return throwError(() => new Error(errorMessage));
  }
}
