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
  private apiUrl = `${environment.apiUrl}/api/Category`;

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

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 409) {
        if (typeof error.error === 'string') {
          errorMessage = `Error: ${error.error}`;
        } else if (error.error && (error.error as any).message) {
          errorMessage = `Error: ${(error.error as any).message}`;
        } else {
          errorMessage = `Error: Category operation conflict.`;
        }
      } else if (error.status === 400) {
        errorMessage = `Error: ${typeof error.error === 'string' ? error.error : (error.error as any)?.message || 'Invalid request.'}`;
      } else if (error.status === 403) {
        errorMessage = `Error: You do not have permission to perform this action.`;
      } else if (error.error && typeof error.error === 'object' && (error.error as any).message) {
        errorMessage = `Error: ${(error.error as any).message}`;
      } else {
        errorMessage = `Server returned code: ${error.status}, error message: ${error.message}`;
      }
    }
    console.error(errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
