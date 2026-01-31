import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // Import Router
import { AuthService } from '../../core/services/auth.service'; // Import AuthService

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <h2>Login</h2>
      <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
        <div class="form-group">
          <label for="username">Username</label>
          <input type="text" id="username" name="username" [(ngModel)]="username" required>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" [(ngModel)]="password" required>
        </div>
        <button type="submit" [disabled]="!loginForm.form.valid">Login</button>
      </form>
      <div *ngIf="errorMessage" class="error-message">{{ errorMessage }}</div>
    </div>
  `,
  styles: [`
    .login-container {
      max-width: 400px;
      margin: 50px auto;
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      background-color: #fff;
    }
    h2 {
      text-align: center;
      margin-bottom: 20px;
      color: #333;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
      color: #555;
    }
    input[type="text"],
    input[type="password"] {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box; /* Include padding in width */
    }
    button {
      width: 100%;
      padding: 10px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }
    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
    .error-message {
      color: red;
      text-align: center;
      margin-top: 15px;
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef) { } // Inject AuthService, Router, and ChangeDetectorRef

  onSubmit() {
    this.errorMessage = null;
    this.authService.login(this.username, this.password).subscribe(
      user => {
        if (user) {
          console.log('Login successful');
          this.router.navigate(['/dashboard']); // Navigate to dashboard on success
        } else {
          this.errorMessage = this.authService.errorMessage || 'Login failed. Please try again.';
          this.cdr.detectChanges(); // Force change detection for error message
        }
      },
      error => {
        this.errorMessage = 'An unexpected error occurred during login.';
        console.error('Login error:', error);
        this.cdr.detectChanges(); // Force change detection for error message
      }
    );
  }
}
