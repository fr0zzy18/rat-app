import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { Router, RouterLink } from '@angular/router'; // Import RouterLink

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink], // Add RouterLink here
  template: `
    <div class="dashboard-container">
      <h2>Welcome to the Dashboard!</h2>
      <p *ngIf="authService.currentUserValue">You are logged in as: {{ authService.currentUserValue.username }}</p>

      <nav class="dashboard-nav">
        <a routerLink="/players" class="nav-button">View Players</a>
        <a *ngIf="authService.hasRole('Manager')" routerLink="/register" class="nav-button">Register User</a>
        <a *ngIf="authService.hasRole('Manager')" routerLink="/manage-users" class="nav-button">Manage Users</a>
      </nav>

      <button (click)="logout()">Logout</button>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      background-color: #f9f9f9;
      text-align: center;
    }
    h2 {
      color: #333;
      margin-bottom: 20px;
    }
    p {
      color: #555;
      margin-bottom: 30px;
    }
    .dashboard-nav {
      margin-bottom: 20px;
    }
    .nav-button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #28a745;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin: 0 10px;
    }
    .nav-button:hover {
      background-color: #218838;
    }
    button {
      padding: 10px 20px;
      background-color: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }
    button:hover {
      background-color: #c82333;
    }
  `]
})
export class DashboardComponent {
  constructor(public authService: AuthService, private router: Router) { }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
