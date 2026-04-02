import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { ProductService } from '../../../core/services/product.service';
import { VarietyService } from '../../../core/services/variety.service';
import { Product } from '../../../core/model/product.model';
import { Variety } from '../../../core/model/variety.model';
import { getProductImage } from '../../../core/utils/product-image.util';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.scss'
})
export class AdminProductsComponent implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly varietyService = inject(VarietyService);

  readonly products = signal<Product[]>([]);
  readonly varieties = signal<Variety[]>([]);
  readonly isLoading = signal(true);
  readonly showModal = signal(false);
  readonly showStockModal = signal(false);
  readonly editingProduct = signal<Product | null>(null);
  readonly selectedProduct = signal<Product | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly isSubmitting = signal(false);

  readonly form = this.fb.group({
    name:      ['', [Validators.required, Validators.minLength(2)]],
    varietyId: ['', Validators.required],
    price:     [0, [Validators.required, Validators.min(0.01)]],
    unit:      ['KG', Validators.required],
    stock:     [0, [Validators.required, Validators.min(0)]]
  });

  readonly stockForm = this.fb.group({
    quantity: [0, [Validators.required]]
  });

  readonly units = ['KG', 'GRAMS', 'UNIT', 'BUNCH', 'BAG', 'LITRE'];

  ngOnInit() {
    this.loadVarieties();
    this.loadProducts();
  }

  loadProducts() {
    this.isLoading.set(true);
    this.productService.getAll().subscribe({
      next: res => { this.products.set(res.content); this.isLoading.set(false); },
      error: () => { this.errorMessage.set('Could not load products.'); this.isLoading.set(false); }
    });
  }

  loadVarieties() {
    this.varietyService.getList().subscribe({
      next: varieties => this.varieties.set(varieties)
    });
  }

  getImage(product: Product): string {
    return getProductImage(product.variety, product.category);
  }

  openCreateModal() {
    this.editingProduct.set(null);
    this.form.reset({ unit: 'KG', stock: 0, price: 0 });
    this.showModal.set(true);
    this.errorMessage.set(null);
  }

  openEditModal(product: Product) {
    this.editingProduct.set(product);
    this.form.patchValue({
      name: product.name,
      varietyId: product.varietyId,
      price: product.price,
      unit: product.unit,
      stock: product.stock
    });
    this.showModal.set(true);
    this.errorMessage.set(null);
  }

  openStockModal(product: Product) {
    this.selectedProduct.set(product);
    this.stockForm.reset({ quantity: product.stock });
    this.showStockModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingProduct.set(null);
  }

  closeStockModal() {
    this.showStockModal.set(false);
    this.selectedProduct.set(null);
  }

  saveProduct() {
    if (this.form.invalid) return;
    this.isSubmitting.set(true);
    const editing = this.editingProduct();

    if (editing) {
      const { stock, ...updateData } = this.form.value;
      this.productService.update(editing.id, updateData as any).subscribe({
        next: updated => {
          this.products.update(products => products.map(p => p.id === updated.id ? updated : p));
          this.closeModal();
          this.isSubmitting.set(false);
        },
        error: () => { this.errorMessage.set('Could not update product.'); this.isSubmitting.set(false); }
      });
    } else {
      this.productService.create(this.form.value as any).subscribe({
        next: created => {
          this.products.update(products => [...products, created]);
          this.closeModal();
          this.isSubmitting.set(false);
        },
        error: () => { this.errorMessage.set('Could not create product.'); this.isSubmitting.set(false); }
      });
    }
  }

  saveStock() {
    if (this.stockForm.invalid) return;
    const product = this.selectedProduct();
    if (!product) return;

    this.isSubmitting.set(true);
    this.productService.updateStock(product.id, { quantity: this.stockForm.value.quantity! }).subscribe({
      next: updated => {
        this.products.update(products => products.map(p => p.id === updated.id ? updated : p));
        this.closeStockModal();
        this.isSubmitting.set(false);
      },
      error: () => { this.errorMessage.set('Could not update stock.'); this.isSubmitting.set(false); }
    });
  }

  toggleAvailability(product: Product) {
    this.productService.toggleAvailability(product.id).subscribe({
      next: updated => this.products.update(products => products.map(p => p.id === updated.id ? updated : p))
    });
  }

  deleteProduct(product: Product) {
    if (!confirm(`Delete ${product.name}?`)) return;
    this.productService.delete(product.id).subscribe({
      next: () => this.products.update(products => products.filter(p => p.id !== product.id)),
      error: () => this.errorMessage.set('Could not delete product.')
    });
  }

  get name() { return this.form.get('name'); }
  get varietyId() { return this.form.get('varietyId'); }
  get price() { return this.form.get('price'); }
  get unit() { return this.form.get('unit'); }
  get stock() { return this.form.get('stock'); }
}