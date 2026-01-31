import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // Import ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.css']
})
export class ManageUsersComponent implements OnInit {
  users: User[] = [];
  roles: string[] = [];
  editingUser: User | null = null;
  editUserForm: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {
    this.editUserForm = this.fb.group({
      id: [''],
      username: ['', Validators.required],
      roleName: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers(): void {
    this.authService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        console.log('Loaded users:', this.users);
        this.cdr.detectChanges(); // Trigger change detection
      },
      error: (err) => {
        this.errorMessage = 'Failed to load users.';
        console.error('Error loading users:', err);
      }
    });
  }

  loadRoles(): void {
    this.authService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load roles.';
        console.error('Error loading roles:', err);
      }
    });
  }

  editUser(user: User): void {
    this.editingUser = user;
    this.editUserForm.patchValue({
      id: user.id,
      username: user.username,
      roleName: user.roles && user.roles.length > 0 ? user.roles[0] : ''
    });
  }

  cancelEdit(): void {
    this.editingUser = null;
    this.editUserForm.reset();
  }

  saveUser(): void {
    if (this.editUserForm.invalid) {
      return;
    }

    const { id, username, roleName } = this.editUserForm.value;

    // Update Username
    if (this.editingUser?.username !== username) {
      this.authService.updateUsername(id, username).subscribe({
        next: () => {
          this.successMessage = `User ${this.editingUser?.username} username updated to ${username}.`;
          this.loadUsers();
        },
        error: (err) => {
          this.errorMessage = err.error || 'Failed to update username.';
          console.error('Error updating username:', err);
        }
      });
    }

    // Update Role
    if (this.editingUser?.roles && this.editingUser?.roles[0] !== roleName) {
      this.authService.updateRole(id, roleName).subscribe({
        next: () => {
          this.successMessage = `User ${username} role updated to ${roleName}.`;
          this.loadUsers();
        },
        error: (err) => {
          this.errorMessage = err.error || 'Failed to update role.';
          console.error('Error updating role:', err);
        }
      });
    }

    this.cancelEdit();
  }

  deleteUser(userId: number, username: string): void {
    if (confirm(`Are you sure you want to delete user ${username}?`)) {
      this.authService.deleteUser(userId).subscribe({
        next: () => {
          this.successMessage = `User ${username} deleted successfully.`;
          this.loadUsers();
        },
        error: (err) => {
          this.errorMessage = err.error || 'Failed to delete user.';
          console.error('Error deleting user:', err);
        }
      });
    }
  }
}
