import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService, CreateCustomerRequest, UpdateCustomerRequest } from '../../../core/services/customer.service';
import { Customer } from '../../../core/model/customer.model';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { ToastService } from '../../../core/services/toast.service';

type ModalMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './admin-customers.component.html',
  styleUrl: './admin-customers.component.scss'
})
export class AdminCustomersComponent implements OnInit {

  private readonly customerService = inject(CustomerService);
  private readonly toast = inject(ToastService);

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

  formName = '';
  formEmail = '';
  formPassword = '';
  formPhoneCountryCode = '+34';
  formPhoneNumber = '';
  formAddressStreetType = '';
  formAddressStreet = '';
  formAddressNumber = '';
  formAddressFloor = '';
  formAddressCity = '';
  formAddressPostalCode = '';
  formAddressProvince = '';

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
    this.formName = '';
    this.formEmail = '';
    this.formPassword = '';
    this.formPhoneCountryCode = '+34';
    this.formPhoneNumber = '';
    this.formAddressStreetType = '';
    this.formAddressStreet = '';
    this.formAddressNumber = '';
    this.formAddressFloor = '';
    this.formAddressCity = '';
    this.formAddressPostalCode = '';
    this.formAddressProvince = '';
    this.selectedCustomer.set(null);
    this.modalMode.set('create');
  }

  openEdit(customer: Customer) {
    this.formName = customer.name;
    this.formEmail = customer.email;
    this.formPassword = '';
    this.formPhoneCountryCode = customer.phoneCountryCode ?? '+34';
    this.formPhoneNumber = customer.phoneNumber ?? '';
    this.formAddressStreetType = customer.addressStreetType ?? '';
    this.formAddressStreet = customer.addressStreet ?? '';
    this.formAddressNumber = customer.addressNumber ?? '';
    this.formAddressFloor = customer.addressFloor ?? '';
    this.formAddressCity = customer.addressCity ?? '';
    this.formAddressPostalCode = customer.addressPostalCode ?? '';
    this.formAddressProvince = customer.addressProvince ?? '';
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
    if (!this.formName.trim() || !this.formEmail.trim() || !this.formPassword.trim() || !this.formPhoneNumber.trim()) return;

    const hasAddress = this.formAddressCity.trim().length > 0;

    const request: CreateCustomerRequest = {
      name: this.formName.trim(),
      email: this.formEmail.trim(),
      password: this.formPassword,
      phoneCountryCode: this.formPhoneCountryCode.trim(),
      phoneNumber: this.formPhoneNumber.trim(),
      addressStreetType: hasAddress ? this.formAddressStreetType : undefined,
      addressStreet: hasAddress ? this.formAddressStreet : undefined,
      addressNumber: hasAddress ? this.formAddressNumber : undefined,
      addressFloor: hasAddress ? this.formAddressFloor : undefined,
      addressCity: hasAddress ? this.formAddressCity : undefined,
      addressPostalCode: hasAddress ? this.formAddressPostalCode : undefined,
      addressProvince: hasAddress ? this.formAddressProvince : undefined
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
        this.toast.error(err.status === 409
          ? 'A customer with that email already exists.'
          : err.status === 400
            ? 'Please check the phone number and address format.'
            : 'Could not create customer.');
        this.isSaving.set(false);
      }
    });
  }

  private updateCustomer() {
    const customer = this.selectedCustomer();
    if (!customer || !this.formName.trim() || !this.formPhoneNumber.trim()) return;

    const hasAddress = this.formAddressCity.trim().length > 0;

    const request: UpdateCustomerRequest = {
      name: this.formName.trim(),
      rawPassword: this.formPassword.trim() || null,
      phoneCountryCode: this.formPhoneCountryCode.trim(),
      phoneNumber: this.formPhoneNumber.trim(),
      addressStreetType: hasAddress ? this.formAddressStreetType : undefined,
      addressStreet: hasAddress ? this.formAddressStreet : undefined,
      addressNumber: hasAddress ? this.formAddressNumber : undefined,
      addressFloor: hasAddress ? this.formAddressFloor : undefined,
      addressCity: hasAddress ? this.formAddressCity : undefined,
      addressPostalCode: hasAddress ? this.formAddressPostalCode : undefined,
      addressProvince: hasAddress ? this.formAddressProvince : undefined
    };

    this.isSaving.set(true);
    this.customerService.update(customer.id, request).subscribe({
      next: updated => {
        this.customers.update(list => list.map(c => c.id === updated.id ? updated : c));
        this.toast.success('Customer updated successfully.');
        this.closeModal();
        this.isSaving.set(false);
      },
      error: err => {
        this.toast.error(err.status === 400
          ? 'Please check the phone number and address format.'
          : 'Could not update customer.');
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