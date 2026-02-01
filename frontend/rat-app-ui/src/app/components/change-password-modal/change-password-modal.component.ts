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
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .modal-content {
      background-color: #fff;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      width: 90%;
      max-width: 400px;
      position: relative;
    }
    .modal-content h3 {
      margin-top: 0;
      margin-bottom: 20px;
      text-align: center;
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
    input.form-control {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
    .modal-actions button {
      width: auto;
      min-width: 100px;
      padding: 8px 15px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .modal-actions button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
    .modal-actions .cancel-button {
      background-color: #6c757d;
    }
    .modal-actions .cancel-button:hover {
      background-color: #5a6268;
    }
    .error-message {
      color: red;
      text-align: center;
      margin-top: 10px;
    }
    .success-message {
      color: green;
      text-align: center;
      margin-top: 10px;
    }
  `]
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
