import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private currentUserSubject: BehaviorSubject<User | null>;
    public currentUser: Observable<User | null>;
    public errorMessage: string | null = null; // Add errorMessage property
    private readonly API_URL = 'http://localhost:5211/api';

    constructor(private http: HttpClient) {
        const storedUser = localStorage.getItem('currentUser');
        this.currentUserSubject = new BehaviorSubject<User | null>(storedUser ? JSON.parse(storedUser) : null);
        this.currentUser = this.currentUserSubject.asObservable();
    }

    public get currentUserValue(): User | null {
        return this.currentUserSubject.value;
    }

    private getAuthHeaders(): HttpHeaders {
        const token = this.getToken();
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    login(username: string, password: string) {
        return this.http.post<any>(`${this.API_URL}/auth/login`, { username, password })
            .pipe(map(user => {
                if (user && user.token) {
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    this.currentUserSubject.next(user);
                    this.errorMessage = null; // Clear error message on successful login
                } else {
                    this.errorMessage = 'Login failed. Please check your credentials.'; // Set generic error message
                }
                return user;
            }));
    }

    logout() {
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
    }

    isAuthenticated(): boolean {
        return this.currentUserValue !== null && this.currentUserValue.token !== undefined;
    }

    getToken(): string | null {
        return this.currentUserValue?.token || null;
    }

    getDecodedToken(): any {
        const token = this.currentUserValue?.token;
        if (token) {
            try {
                return jwtDecode(token);
            } catch (Error) {
                return null;
            }
        }
        return null;
    }

    hasRole(role: string): boolean {
        const user = this.currentUserValue;
        if (user && user.roles) {
            return user.roles.includes(role);
        }
        return false;
    }

    register(username: string, password: string, roleName: string) {
        return this.http.post(`${this.API_URL}/auth/register`, { username, password, roleName }, { headers: this.getAuthHeaders() });
    }

    getRoles(): Observable<string[]> {
        return this.http.get<string[]>(`${this.API_URL}/auth/roles`, { headers: this.getAuthHeaders() });
    }

    getAllUsers(): Observable<User[]> {
        return this.http.get<User[]>(`${this.API_URL}/auth/users`, { headers: this.getAuthHeaders() });
    }

    updateUsername(userId: number, newUsername: string): Observable<User> {
        return this.http.put<User>(`${this.API_URL}/auth/users/username`, { userId, username: newUsername }, { headers: this.getAuthHeaders() });
    }

    updateRole(userId: number, newRoleName: string): Observable<User> {
        return this.http.put<User>(`${this.API_URL}/auth/users/role`, { userId, roleName: newRoleName }, { headers: this.getAuthHeaders() });
    }

    deleteUser(userId: number): Observable<any> {
        return this.http.delete(`${this.API_URL}/auth/users/${userId}`, { headers: this.getAuthHeaders() });
    }
}