import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { CustomerService, CreateCustomerRequest, UpdateCustomerRequest } from '../../../core/services/customer.service';
import { Customer } from '../../../core/model/customer.model';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { ToastService } from '../../../core/services/toast.service';

type ModalMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './admin-customers.component.html',
  styleUrl: './admin-customers.component.scss'
})
export class AdminCustomersComponent implements OnInit {

  private readonly customerService = inject(CustomerService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly customers = signal<Customer[]>([]);
  readonly isLoading = signal(true);
  readonly detailCustomer = signal<Customer | null>(null);

  readonly searchTerm = signal('');

  readonly filteredCustomers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.customers();
    return this.customers().filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term)
    );
  });

  readonly modalMode = signal<ModalMode>(null);
  readonly selectedCustomer = signal<Customer | null>(null);
  readonly isSaving = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly confirmDeleteId = signal<string | null>(null);
  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],

    phoneCountryCode: ['+34', Validators.required],
    phoneNumber: ['', Validators.required],

    addressStreetType: [''],
    addressStreet: [''],
    addressNumber: [''],
    addressFloor: [''],
    addressPostalCode: [''],
    addressCity: [''],
    addressProvince: ['']
  });

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.isLoading.set(true);
    this.customerService.getAll().subscribe({
      next: res => {
        this.customers.set(res.content);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Could not load customers.');
        this.isLoading.set(false);
      }
    });
  }


  openCreate() {
    this.form.reset({
      phoneCountryCode: '+34',
      email: '',
      password: '',
    });
    this.selectedCustomer.set(null);
    this.modalMode.set('create');
  }

  openEdit(customer: Customer) {
    this.form.reset({
      name: customer.name,
      email: customer.email,
      password: '',
      phoneCountryCode: customer.phoneCountryCode ?? '+34',
      phoneNumber: customer.phoneNumber ?? '',
      addressStreetType: customer.addressStreetType ?? '',
      addressStreet: customer.addressStreet ?? '',
      addressNumber: customer.addressNumber ?? '',
      addressFloor: customer.addressFloor ?? '',
      addressPostalCode: customer.addressPostalCode ?? '',
      addressCity: customer.addressCity ?? '',
      addressProvince: customer.addressProvince ?? ''
    });

    this.selectedCustomer.set(customer);
    this.modalMode.set('edit');
  }

  closeModal() {
    this.modalMode.set(null);
    this.selectedCustomer.set(null);
  }

  openDetail(customer: Customer) {
    this.detailCustomer.set(customer);
  }

  closeDetail() {
    this.detailCustomer.set(null);
  }

  save() {
    if (this.modalMode() === 'create') {
      this.createCustomer();
    } else {
      this.updateCustomer();
    }
  }

  private createCustomer() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();

    const hasAddress = !!v.addressCity?.trim();

    const request: CreateCustomerRequest = {
      name: v.name!.trim(),
      email: v.email!.trim(),
      password: v.password!,
      phoneCountryCode: v.phoneCountryCode!,
      phoneNumber: v.phoneNumber!,

      addressStreetType: hasAddress ? v.addressStreetType ?? undefined : undefined,
      addressStreet: hasAddress ? v.addressStreet ?? undefined : undefined,
      addressNumber: hasAddress ? v.addressNumber ?? undefined : undefined,
      addressFloor: hasAddress ? v.addressFloor ?? undefined : undefined,
      addressCity: hasAddress ? v.addressCity ?? undefined : undefined,
      addressPostalCode: hasAddress ? v.addressPostalCode ?? undefined : undefined,
      addressProvince: hasAddress ? v.addressProvince ?? undefined : undefined
    };

    this.isSaving.set(true);

    this.customerService.create(request).subscribe({
      next: created => {
        this.customers.update(list => [created, ...list]);
        this.toast.success('Customer created successfully.');
        this.closeModal();
        this.isSaving.set(false);
      },
      error: err => {
        this.toast.error('Could not create customer.');
        this.isSaving.set(false);
      }
    });
  }

  private updateCustomer() {
    const customer = this.selectedCustomer();
    if (!customer) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const hasAddress = !!v.addressCity?.trim();

    const request: UpdateCustomerRequest = {
      name: v.name!.trim(),
      rawPassword: v.password?.trim() || null,
      phoneCountryCode: v.phoneCountryCode!,
      phoneNumber: v.phoneNumber!,

      addressStreetType: hasAddress ? v.addressStreetType ?? undefined : undefined,
      addressStreet: hasAddress ? v.addressStreet ?? undefined : undefined,
      addressNumber: hasAddress ? v.addressNumber ?? undefined : undefined,
      addressFloor: hasAddress ? v.addressFloor ?? undefined : undefined,
      addressCity: hasAddress ? v.addressCity ?? undefined : undefined,
      addressPostalCode: hasAddress ? v.addressPostalCode ?? undefined : undefined,
      addressProvince: hasAddress ? v.addressProvince ?? undefined : undefined
    };

    this.isSaving.set(true);

    this.customerService.update(customer.id, request).subscribe({
      next: updated => {
        this.customers.update(list =>
          list.map(c => c.id === updated.id ? updated : c)
        );
        this.toast.success('Customer updated successfully.');
        this.closeModal();
        this.isSaving.set(false);
      },
      error: () => {
        this.toast.error('Could not update customer.');
        this.isSaving.set(false);
      }
    });
  }

  requestDelete(id: string) {
    this.confirmDeleteId.set(id);
  }

  cancelDelete() {
    this.confirmDeleteId.set(null);
  }

  confirmDelete(id: string) {
    this.deletingId.set(id);
    this.confirmDeleteId.set(null);

    this.customerService.delete(id).subscribe({
      next: () => {
        this.customers.update(list => list.filter(c => c.id !== id));
        this.toast.success('Customer deleted successfully.');
        this.deletingId.set(null);
      },
      error: () => {
        this.toast.error('Could not delete customer.');
        this.deletingId.set(null);
      }
    });
  }
}