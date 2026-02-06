import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { Role } from '../../core/entities/role';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  roles: Role[] = [];
  selectedRole: string = 'Player'; // Default role
  error = '';
  successMessage: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.registerForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      roleName: ['Player', Validators.required]
    });
  }

  ngOnInit() {
    this.authService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        if (roles.length > 0 && !roles.some(r => r.name === this.selectedRole)) {
          this.selectedRole = roles[0].name; // Set default if 'Player' is not available
          this.registerForm.get('roleName')?.setValue(this.selectedRole);
        }
      },
      error: (err) => {
        this.error = 'Failed to load roles.';
        console.error('Error loading roles:', err);
      }
    });
  }

  onSubmit() {
    this.error = '';
    this.successMessage = null;

    if (this.registerForm.invalid) {
      return;
    }

    const { username, password, roleName } = this.registerForm.value;

    this.authService.register(username, password, roleName)
      .subscribe({
        next: () => {
          this.successMessage = `User ${username} registered successfully with role ${roleName}.`;
          this.registerForm.reset();
          this.registerForm.get('roleName')?.setValue(this.selectedRole); // Reset role dropdown
        },
        error: error => {
          this.error = error.error || 'Registration failed.';
        }
      });
  }
}
