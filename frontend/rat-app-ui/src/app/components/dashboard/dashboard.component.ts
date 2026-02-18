import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
   <div class="dashboard-container">
  <div class="dashboard-card">
    <h2>One day there will be something cool on this page. But now, look at NAV BAR</h2>
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
