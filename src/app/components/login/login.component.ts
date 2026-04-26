import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule, TranslocoModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  readonly langs = ['es', 'en', 'nl'];
  get activeLang() { return this.transloco.getActiveLang(); }
  setLanguage(lang: string) { this.transloco.setActiveLang(lang); }

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

    this.authService.login(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/']),
      error: err => {
        this.errorMessage.set(
        err.status === 401
          ? 'login.errors.auth_failed'
          : 'login.errors.generic_error'
      );
        this.isLoading.set(false);
      }
    });
  }

  get email() { return this.form.get('email'); }
  get rawPassword() { return this.form.get('rawPassword'); }
}