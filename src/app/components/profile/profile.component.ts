import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { CustomerService } from '../../core/services/customer.service';
import { Customer } from '../../core/model/customer.model';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly customerService = inject(CustomerService);

  readonly customer = signal<Customer | null>(null);
  readonly isEditing = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    rawPassword: ['', [Validators.minLength(8)]]
  });

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.customer.set(user);
      this.form.patchValue({ name: user.name });
    }
  }

  startEditing() {
    this.isEditing.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  cancelEditing() {
    const user = this.customer();
    if (user) this.form.patchValue({ name: user.name, rawPassword: '' });
    this.isEditing.set(false);
    this.errorMessage.set(null);
  }

  saveProfile() {
    if (this.form.invalid) return;

    const customer = this.customer();
    if (!customer) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const rawPassword = this.form.value.rawPassword;

    this.customerService.update(customer.id, {
      name: this.form.value.name!,
      rawPassword: rawPassword || null
    }).subscribe({
      next: updated => {
        this.customer.set(updated);
        this.isEditing.set(false);
        this.isLoading.set(false);
        this.successMessage.set('Profile updated successfully');
        setTimeout(() => this.successMessage.set(null), 4000);
      },
      error: () => {
        this.errorMessage.set('Could not update profile. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  logout() {
    this.authService.logout();
  }

  get name() { return this.form.get('name'); }
  get rawPassword() { return this.form.get('rawPassword'); }
}