import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss'
})
export class AdminLoginComponent {

  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    rawPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  onSubmit() {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.http.post<{ token: string }>(
      `${environment.apiUrl}/auth/login/admin`,
      this.form.value
    ).pipe(
      tap(res => this.authService.saveAdminToken(res.token))
    ).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: err => {
        this.errorMessage.set(
          err.status === 401
            ? 'Invalid email or password'
            : 'Login failed. Please try again.'
        );
        this.isLoading.set(false);
      }
    });
  }

  get email() { return this.form.get('email'); }
  get rawPassword() { return this.form.get('rawPassword'); }
}