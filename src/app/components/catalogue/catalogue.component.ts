import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DecimalPipe, LowerCasePipe } from '@angular/common';
import { ProductService } from '../../core/services/product.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/auth/auth.service';
import { Product } from '../../core/model/product.model';
import { getProductImage } from '../../core/utils/product-image.util';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';


interface CartItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-catalogue',
  standalone: true,
  imports: [CommonModule, NavbarComponent, TranslocoModule],
  templateUrl: './catalogue.component.html',
  styleUrl: './catalogue.component.scss'
})
export class CatalogueComponent implements OnInit {

  private readonly transloco = inject(TranslocoService);

  private readonly productService = inject(ProductService);
  private readonly orderService = inject(OrderService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly products = signal<Product[]>([]);
  readonly cart = signal<Map<string, number>>(new Map());
  readonly isLoading = signal(true);
  readonly isOrdering = signal(false);
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

  readonly cartTotal = computed(() => {
    let total = 0;
    this.cart().forEach((qty, productId) => {
      const product = this.products().find(p => p.id === productId);
      if (product) total += product.price * qty;
    });
    return total.toFixed(2);
  });

  readonly cartItemCount = computed(() => {
    let count = 0;
    this.cart().forEach(qty => count += qty);
    return count;
  });

  readonly hasItemsInCart = computed(() => this.cartItemCount() > 0);

  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());

  readonly isMobile = signal(window.innerWidth < 768);

readonly viewMode = signal<'1' | '2' | 'grid'>('1');

constructor() {
  window.addEventListener('resize', () => {
    const mobile = window.innerWidth < 768;
    this.isMobile.set(mobile);

    if (mobile && this.viewMode() === 'grid') {
      this.viewMode.set('1');
    }
  });
}


setView(mode: '1' | '2' | 'grid') {


  if (this.isMobile()) {
    if (mode === 'grid') return;
  } else {
  }

  this.viewMode.set(mode);
}

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

  getImage(product: Product): string {
    return getProductImage(product.variety, product.category);
  }

  getQuantity(productId: string): number {
    return this.cart().get(productId) ?? 0;
  }

  increase(product: Product) {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    const newCart = new Map(this.cart());
    newCart.set(product.id, (newCart.get(product.id) ?? 0) + 1);
    this.cart.set(newCart);
  }

  decrease(product: Product) {
    const current = this.cart().get(product.id) ?? 0;
    if (current === 0) return;
    const newCart = new Map(this.cart());
    if (current === 1) {
      newCart.delete(product.id);
    } else {
      newCart.set(product.id, current - 1);
    }
    this.cart.set(newCart);
  }

  selectCategory(category: string) {
    this.selectedCategory.set(category);
  }

  placeOrder() {
    const customer = this.authService.currentUser();
    if (!customer) {
      this.router.navigate(['/login']);
      return;
    }

    const lines = Array.from(this.cart().entries()).map(([productId, quantity]) => ({
      productId,
      quantity
    }));

    this.isOrdering.set(true);
    this.errorMessage.set(null);

    this.orderService.create({
      customerId: customer.id,
      lines
    }).subscribe({
      next: res => {
        this.cart.set(new Map());
        this.isOrdering.set(false);
        if (res.possibleDuplicate) {
          this.successMessage.set(this.transloco.translate('order.placed_duplicate'));
        } else {
          this.successMessage.set(this.transloco.translate('order.placed_success'));
        }
        setTimeout(() => this.successMessage.set(null), 5000);
      },
      error: () => {
        this.errorMessage.set(this.transloco.translate('order.place_error'));
        this.isOrdering.set(false);
      }
    });
  }

  logout() {
    this.authService.logout();
  }
}