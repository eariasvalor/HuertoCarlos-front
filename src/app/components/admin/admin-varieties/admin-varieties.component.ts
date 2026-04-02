import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { VarietyService } from '../../../core/services/variety.service';
import { Variety } from '../../../core/model/variety.model';

@Component({
  selector: 'app-admin-varieties',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './admin-varieties.component.html',
  styleUrl: './admin-varieties.component.scss'
})
export class AdminVarietiesComponent implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly varietyService = inject(VarietyService);

  readonly varieties = signal<Variety[]>([]);
  readonly isLoading = signal(true);
  readonly showModal = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isSubmitting = signal(false);

  readonly form = this.fb.group({
    name:            ['', [Validators.required, Validators.minLength(2)]],
    productCategory: ['', Validators.required]
  });

  ngOnInit() {
    this.loadVarieties();
  }

  loadVarieties() {
    this.isLoading.set(true);
    this.varietyService.getAll().subscribe({
      next: res => { this.varieties.set(res.content); this.isLoading.set(false); },
      error: () => { this.errorMessage.set('Could not load varieties.'); this.isLoading.set(false); }
    });
  }

  openCreateModal() {
    this.form.reset();
    this.showModal.set(true);
    this.errorMessage.set(null);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveVariety() {
    if (this.form.invalid) return;
    this.isSubmitting.set(true);

    this.varietyService.create(
      this.form.value.name!,
      this.form.value.productCategory!
    ).subscribe({
      next: created => {
        this.varieties.update(varieties => [...varieties, created]);
        this.closeModal();
        this.isSubmitting.set(false);
      },
      error: err => {
        this.errorMessage.set(
          err.status === 409
            ? 'A variety with this name already exists in this category'
            : 'Could not create variety.'
        );
        this.isSubmitting.set(false);
      }
    });
  }

  deleteVariety(variety: Variety) {
    if (!confirm(`Delete variety "${variety.name}"?`)) return;
    this.varietyService.delete(variety.id).subscribe({
      next: () => this.varieties.update(varieties => varieties.filter(v => v.id !== variety.id)),
      error: err => this.errorMessage.set(
        err.status === 409
          ? `Cannot delete "${variety.name}" — it is used by one or more products`
          : 'Could not delete variety.'
      )
    });
  }

  get name() { return this.form.get('name'); }
  get productCategory() { return this.form.get('productCategory'); }
}