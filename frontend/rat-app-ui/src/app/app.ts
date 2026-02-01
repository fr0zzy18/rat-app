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
  styles: [`
    .app-header {
      background-color: #333;
      color: white;
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    .header-content {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .app-title {
      font-size: 1.5em;
      font-weight: bold;
      cursor: pointer; /* Add cursor pointer for better UX */
    }
    .app-title-link {
        color: inherit; /* Inherit color from parent */
        text-decoration: none; /* Remove underline */
    }
    .user-section {
      position: relative;
    }
    .username {
      cursor: pointer;
      font-weight: bold;
      padding: 5px 10px;
      border-radius: 4px;
      background-color: #555;
    }
    .username:hover {
      background-color: #777;
    }
    .logout-popup {
      position: absolute;
      top: 40px;
      right: 0;
      background-color: white;
      color: #333;
      padding: 15px;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      z-index: 1000;
      text-align: center;
      min-width: 200px;
      display: flex; /* Use flexbox for button layout */
      flex-direction: column; /* Stack buttons vertically */
      gap: 10px; /* Space between buttons */
    }
    .logout-popup p {
      margin-bottom: 10px;
      font-size: 0.9em;
    }
    .logout-popup button {
      background-color: #dc3545;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85em;
      width: 100%; /* Make buttons full width */
      margin: 0; /* Reset margin */
    }
    .logout-popup button:hover {
      background-color: #c82333;
    }
    .logout-popup button:last-child {
      background-color: #6c757d;
    }
    .logout-popup button:last-child:hover {
      background-color: #5a6268;
    }
    /* Style for the new Change Password button */
    .logout-popup button:nth-child(3) { /* Assuming "Change Password" is the third button */
      background-color: #007bff; /* Blue color for change password */
    }
    .logout-popup button:nth-child(3):hover {
      background-color: #0056b3;
    }
  `]
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
