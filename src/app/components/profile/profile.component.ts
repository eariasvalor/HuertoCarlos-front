import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { CustomerService } from '../../core/services/customer.service';
import { Customer } from '../../core/model/customer.model';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent, TranslocoModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly customerService = inject(CustomerService);
  protected readonly translocoService = inject(TranslocoService);

  readonly customer = signal<Customer | null>(null);
  readonly isEditing = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    rawPassword: ['', [Validators.minLength(8)]],
    phoneCountryCode: ['+34', [Validators.required]],
    phoneNumber: ['', [Validators.required]],
    addressStreetType: [''],
    addressStreet: [''],
    addressNumber: [''],
    addressFloor: [''],
    addressCity: [''],
    addressPostalCode: [''],
    addressProvince: ['']
  });

  ngOnInit() {
  const user = this.authService.currentUser();
  if (!user) return;

  this.customerService.getById(user.id).subscribe({
    next: customer => {
      this.customer.set(customer);
      this.form.patchValue({
        name: customer.name,
        phoneCountryCode: customer.phoneCountryCode ?? '+34',
        phoneNumber: customer.phoneNumber ?? '',
        addressStreetType: customer.addressStreetType ?? '',
        addressStreet: customer.addressStreet ?? '',
        addressNumber: customer.addressNumber ?? '',
        addressFloor: customer.addressFloor ?? '',
        addressCity: customer.addressCity ?? '',
        addressPostalCode: customer.addressPostalCode ?? '',
        addressProvince: customer.addressProvince ?? ''
      });
    },
    error: () => this.errorMessage.set(this.translocoService.translate('profile.errors.load_error'))
  });
}

  startEditing() {
    this.isEditing.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  cancelEditing() {
    const user = this.customer();
    if (user) {
      this.form.patchValue({
        name: user.name,
        rawPassword: '',
        phoneCountryCode: user.phoneCountryCode ?? '+34',
        phoneNumber: user.phoneNumber ?? '',
        addressStreetType: user.addressStreetType ?? '',
        addressStreet: user.addressStreet ?? '',
        addressNumber: user.addressNumber ?? '',
        addressFloor: user.addressFloor ?? '',
        addressCity: user.addressCity ?? '',
        addressPostalCode: user.addressPostalCode ?? '',
        addressProvince: user.addressProvince ?? ''
      });
    }
    this.isEditing.set(false);
    this.errorMessage.set(null);
  }

  saveProfile() {
    if (this.form.invalid) return;

    const customer = this.customer();
    if (!customer) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const v = this.form.value;
    const hasAddress = v.addressCity && v.addressCity.trim().length > 0;

    this.customerService.update(customer.id, {
      name: v.name!,
      rawPassword: v.rawPassword || null,
      phoneCountryCode: v.phoneCountryCode!,
      phoneNumber: v.phoneNumber!,
      addressStreetType: hasAddress ? v.addressStreetType! : undefined,
      addressStreet: hasAddress ? v.addressStreet! : undefined,
      addressNumber: hasAddress ? v.addressNumber! : undefined,
      addressFloor: hasAddress ? v.addressFloor! : undefined,
      addressCity: hasAddress ? v.addressCity! : undefined,
      addressPostalCode: hasAddress ? v.addressPostalCode! : undefined,
      addressProvince: hasAddress ? v.addressProvince! : undefined
    }).subscribe({
      next: updated => {
        this.customer.set(updated);
        this.isEditing.set(false);
        this.isLoading.set(false);
        this.successMessage.set(this.translocoService.translate('profile.success.updated'));
        setTimeout(() => this.successMessage.set(null), 4000);
      },
      error: () => {
        this.errorMessage.set(this.translocoService.translate('profile.errors.update_error'));
        this.isLoading.set(false);
      }
    });
  }

  logout() { this.authService.logout(); }

  get name() { return this.form.get('name'); }
  get rawPassword() { return this.form.get('rawPassword'); }
  get phoneCountryCode() { return this.form.get('phoneCountryCode'); }
  get phoneNumber() { return this.form.get('phoneNumber'); }
}