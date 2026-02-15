import { environment } from '@env/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { UserDto } from '../dtos/user-dto';
import { Role } from '../entities/role';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private currentUserSubject: BehaviorSubject<UserDto | null>;
  public currentUser: Observable<UserDto | null>;
  public errorMessage: string | null = null;

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('token');
    let user: UserDto | null = null;
    if (token) {
      console.log('AuthService: Token found in localStorage:', token);
      const decodedToken: any = jwtDecode(token);
      console.log('AuthService: Decoded token in constructor:', decodedToken);
      // Map JWT claims to UserDto
      user = {
        id: decodedToken.sub?.toString() || '', // Ensure ID is always a string
        username: decodedToken.unique_name || decodedToken.name, // Prioritize unique_name, fallback to name
        roles: Array.isArray(decodedToken.role) ? decodedToken.role : [decodedToken.role] // 'role' can be string or array
      };
    }
    this.currentUserSubject = new BehaviorSubject<UserDto | null>(user);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): UserDto | null {
    return this.currentUserSubject.value;
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials, { responseType: 'text' }).pipe(
      tap((token: any) => {
        localStorage.setItem('token', token);
        console.log('AuthService: Token received from login:', token);
        const decodedToken: any = jwtDecode(token);
        console.log('AuthService: Decoded token in login:', decodedToken);
        const user: UserDto = {
          id: decodedToken.sub?.toString() || '',
          username: decodedToken.unique_name || decodedToken.name, // Prioritize unique_name, fallback to name
          roles: Array.isArray(decodedToken.role) ? decodedToken.role : [decodedToken.role]
        };
        this.currentUserSubject.next(user);
        this.errorMessage = null;
      }),
      catchError((error: HttpErrorResponse) => {
        this.errorMessage = error.error;
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return this.currentUserValue !== null;
  }

  hasRole(role: string): boolean {
    return this.currentUserValue?.roles?.includes(role) ?? false;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  changePassword(userId: number, newPassword: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/change-password`, { userId, newPassword });
  }

  getAllUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.apiUrl}/users`);
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/roles`);
  }

  updateUsername(id: number, username: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}/username`, { username });
  }

  updateRole(userId: number, roleName: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/role`, { userId, roleName });
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`);
  }

  register(username: string, password: string, roleName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { username, password, roleName });
  }

  getUser(): any {
    return this.currentUserSubject.value;
  }
}