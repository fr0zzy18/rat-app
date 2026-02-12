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
  <div class="dashboard-card">
    <h2>Work in progress...</h2>
    <p *ngIf="authService.currentUserValue">
      You are logged in as: <span class="username-highlight">{{ authService.currentUserValue.username }}</span>
    </p>
  </div>
</div>
  `,
  styleUrls: ['./dashboard.component.css'] // Use styleUrls
})
export class DashboardComponent {
  constructor(public authService: AuthService) { } // Removed Router from constructor
}
