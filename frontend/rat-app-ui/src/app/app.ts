import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, RouterLink } from '@angular/router'; // Import RouterLink
import { CommonModule, NgIf } from '@angular/common'; // Import CommonModule and NgIf
import { AuthService } from './core/services/auth.service'; // Import AuthService
import { filter } from 'rxjs/operators'; // Import filter for router events
import { ChangePasswordModalComponent } from './components/change-password-modal/change-password-modal.component'; // Import the new component

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NgIf, RouterLink, ChangePasswordModalComponent], // Include RouterLink and new modal component
  template: `
    <header *ngIf="showNavbar" class="app-header">
      <div class="header-content">
        <a routerLink="/dashboard" class="app-title-link">
          <span class="app-title">RatApp</span>
        </a>
        <div *ngIf="authService.isAuthenticated()" class="user-section">
          <span class="username" (click)="toggleLogoutPopup()">{{ authService.currentUserValue?.username }}</span>
          <div *ngIf="showLogoutPopup" class="logout-popup">
            <p>Are you sure you want to log out?</p>
            <button (click)="logout()">Yes, Logout</button>
            <button (click)="openChangePasswordModal()">Change Password</button>
            <button (click)="toggleLogoutPopup()">Cancel</button>
          </div>
        </div>
      </div>
    </header>
    <router-outlet></router-outlet>

    <app-change-password-modal
      *ngIf="showChangePasswordModal"
      [userId]="authService.currentUserValue?.id!"
      (closeModal)="closeChangePasswordModal()"
      (passwordChanged)="onPasswordChanged()"
    ></app-change-password-modal>
  `,
  styleUrls: ['./app.component.css']
})
export class App implements OnInit { // Implement OnInit
  showLogoutPopup: boolean = false;
  showChangePasswordModal: boolean = false; // New property
  showNavbar: boolean = true; // Control visibility of the navbar

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Subscribe to router events to control navbar visibility
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.showNavbar = event.url !== '/login';
    });
  }

  toggleLogoutPopup(): void {
    this.showLogoutPopup = !this.showLogoutPopup;
    // Ensure change password modal is closed when toggling logout popup
    if (!this.showLogoutPopup) {
      this.showChangePasswordModal = false;
    }
  }

  openChangePasswordModal(): void {
    this.showLogoutPopup = false; // Close logout popup
    this.showChangePasswordModal = true; // Open change password modal
  }

  closeChangePasswordModal(): void {
    this.showChangePasswordModal = false;
  }

  onPasswordChanged(): void {
    // Handle any post-password change actions, e.g., show a success message
    console.log('Password changed successfully!');
    this.closeChangePasswordModal();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.showLogoutPopup = false; // Hide popup after logout
  }
}
