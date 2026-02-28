import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="login-container">
  <div class="login-card">
    <h2>Login</h2>
    <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
      
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" [(ngModel)]="username" required class="form-control">
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" [(ngModel)]="password" required class="form-control">
      </div>

      <button type="submit" [disabled]="!loginForm.form.valid" class="login-button">Login</button>
    </form>

    <div *ngIf="errorMessage" class="error-message">{{ errorMessage }}</div>
  </div>
</div>

  `,
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit() {
    this.errorMessage = null;
    this.authService.login({ username: this.username, password: this.password }).subscribe(
      user => {
        if (user) {
          console.log('Login successful');
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = this.authService.errorMessage || 'Login failed. Please try again.';
          this.cdr.detectChanges();
        }
      },
      error => {
        this.errorMessage = 'An unexpected error occurred during login.';
        console.error('Login error:', error);
        this.cdr.detectChanges();
      }
    );
  }
}
