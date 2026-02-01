import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay">
      <div class="modal-content">
        <h3>Change Password</h3>
        <form (ngSubmit)="onSubmit()" #changePasswordForm="ngForm">
          <div class="form-group">
            <label for="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              [(ngModel)]="newPassword"
              required
              minlength="6"
              #passwordField="ngModel"
              class="form-control"
            >
            <div *ngIf="passwordField.invalid && (passwordField.dirty || passwordField.touched)" class="error-message">
              <div *ngIf="passwordField.errors?.['required']">Password is required.</div>
              <div *ngIf="passwordField.errors?.['minlength']">Password must be at least 6 characters long.</div>
            </div>
          </div>
          <div class="modal-actions">
            <button type="submit" [disabled]="!changePasswordForm.form.valid">Change Password</button>
            <button type="button" class="cancel-button" (click)="onCancel()">Cancel</button>
          </div>
        </form>
        <div *ngIf="errorMessage" class="error-message">{{ errorMessage }}</div>
        <div *ngIf="successMessage" class="success-message">{{ successMessage }}</div>
      </div>
    </div>
  `,
  styleUrls: ['./change-password-modal.component.css']
})
export class ChangePasswordModalComponent {
  @Input() userId!: number;
  @Output() closeModal = new EventEmitter<void>();
  @Output() passwordChanged = new EventEmitter<void>();

  newPassword = '';
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(private authService: AuthService) { }

  onSubmit(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (!this.userId) {
      this.errorMessage = 'User ID is not provided.';
      return;
    }

    this.authService.changePassword(this.userId, this.newPassword).subscribe({
      next: () => {
        this.successMessage = 'Password changed successfully!';
        // Optionally, close the modal after a short delay
        setTimeout(() => this.passwordChanged.emit(), 1500);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to change password.';
        console.error('Change password error:', err);
      }
    });
  }

  onCancel(): void {
    this.closeModal.emit();
  }
}
