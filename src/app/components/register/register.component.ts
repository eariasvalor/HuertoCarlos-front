import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslocoModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly translocoService = inject(TranslocoService);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    rawPassword: ['', [Validators.required, Validators.minLength(8)]],
    phoneCountryCode: ['+34', [Validators.required]],
    phoneNumber: ['', [Validators.required]]
  });

  onSubmit() {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.register(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/login']),
      error: err => {
        this.errorMessage.set(
          err.status === 409
            ? this.translocoService.translate('register.errors.email_taken')
            : this.translocoService.translate('register.errors.generic_error')
        );
        this.isLoading.set(false);
      }
    });
  }

  get name() { return this.form.get('name'); }
  get email() { return this.form.get('email'); }
  get rawPassword() { return this.form.get('rawPassword'); }
  get phoneCountryCode() { return this.form.get('phoneCountryCode'); }
  get phoneNumber() { return this.form.get('phoneNumber'); }
}