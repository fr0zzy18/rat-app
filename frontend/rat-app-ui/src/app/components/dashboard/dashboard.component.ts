import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { RouterLink } from '@angular/router'; // Only RouterLink needed

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
    </div>
  `,
  styleUrls: ['./dashboard.component.css'] // Use styleUrls
})
export class DashboardComponent {
  constructor(public authService: AuthService) { } // Removed Router from constructor
}
