import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../core/services/product.service';
import { AuthService } from '../../core/auth/auth.service';
import { Product } from '../../core/model/product.model';
import { getProductImage } from '../../core/utils/product-image.util';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { TranslocoModule } from '@ngneat/transloco';
import { CartService } from '../../core/services/cart-service';

@Component({
  selector: 'app-catalogue',
  standalone: true,
  imports: [CommonModule, NavbarComponent, TranslocoModule],
  templateUrl: './catalogue.component.html',
  styleUrl: './catalogue.component.scss'
})
export class CatalogueComponent implements OnInit {

  private readonly productService = inject(ProductService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);

  readonly today = new Date();

  readonly products = signal<Product[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly selectedCategory = signal<string>('All');

  readonly categories = computed(() => {
    const cats = new Set(this.products().map(p => p.category));
    return ['All', ...cats];
  });

  readonly filteredProducts = computed(() => {
    const cat = this.selectedCategory();
    if (cat === 'All') return this.products();
    return this.products().filter(p => p.category === cat);
  });

  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.isLoading.set(true);
    this.productService.getAvailable().subscribe({
      next: res => {
        this.products.set(res.content);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load products. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  getCategoryClass(category: string): string {
    const c = category.toLowerCase();
    if (c.includes('tomat')) return 'tomato';
    if (c.includes('green') || c.includes('verde') || c.includes('lech') || c.includes('espin')) return 'green';
    if (c.includes('pepper') || c.includes('pimient')) return 'pepper';
    if (c.includes('herb') || c.includes('hierba') || c.includes('basil') || c.includes('albahaca')) return 'herb';
    if (c.includes('root') || c.includes('raiz') || c.includes('raíz') || c.includes('zanahor') || c.includes('carrot')) return 'root';
    return 'default';
  }

  getQuantity(productId: string) {
    return this.cartService.getQuantity(productId);
  }

  increase(product: Product) {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.cartService.increase(product.id);
  }

  decrease(product: Product) {
    this.cartService.decrease(product.id);
  }

  selectCategory(category: string) {
    this.selectedCategory.set(category);
  }

  getImage(product: Product): string {
    return product.image || getProductImage(product.variety, product.category);
  }

  onImageError(e: Event) {
    (e.target as HTMLImageElement).style.display = 'none';
  }
}
