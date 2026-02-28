import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, RouterLink } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { filter } from 'rxjs/operators';
import { ChangePasswordModalComponent } from './components/change-password-modal/change-password-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NgIf, RouterLink, ChangePasswordModalComponent],
  template: `
    <header *ngIf="showNavbar" class="app-header">
      <div class="header-content">
        <a routerLink="/dashboard" class="app-title-link">
          <span class="app-title">RatApp</span>
        </a>
        <div class ="left-nav">
        <nav *ngIf="authService.isAuthenticated()" class="nav-links">
          <a routerLink="/players" class="nav-link">Players</a>
          <a routerLink="/bingo" class="nav-link">Bingo</a>
        </nav>
        </div>
        <div class ="right-nav">
        <nav *ngIf="authService.isAuthenticated() && authService.hasRole('Manager')" class="manager-links">
          <a routerLink="/register" class="nav-link">Register User</a>
          <a routerLink="/manage-users" class="nav-link">Manage Users</a>
        </nav>
        </div>
        <div *ngIf="authService.isAuthenticated()" class="user-section">
          <span class="username" (click)="toggleLogoutPopup()">{{ authService.currentUserValue?.username }}</span>
          <div *ngIf="showLogoutPopup" class="logout-popup">
            <p class="logout-message">Hello there {{ authService.currentUserValue?.username }}!</p>
            <button (click)="logout()">Logout</button>
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
export class App implements OnInit {
  showLogoutPopup: boolean = false;
  showChangePasswordModal: boolean = false;
  showNavbar: boolean = true;

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.showNavbar = event.url !== '/login';
    });
  }

  toggleLogoutPopup(): void {
    this.showLogoutPopup = !this.showLogoutPopup;
    if (!this.showLogoutPopup) {
      this.showChangePasswordModal = false;
    }
  }

  openChangePasswordModal(): void {
    this.showLogoutPopup = false;
    this.showChangePasswordModal = true;
  }

  closeChangePasswordModal(): void {
    this.showChangePasswordModal = false;
  }

  onPasswordChanged(): void {
    console.log('Password changed successfully!');
    this.closeChangePasswordModal();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.showLogoutPopup = false;
  }
}
