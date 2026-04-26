import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart-service';
import { ProductService } from '../../core/services/product.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Product } from '../../core/model/product.model';
import { getProductImage } from '../../core/utils/product-image.util';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { DbTranslatePipe } from '../../core/pipes/db-translate.pipe';

export interface CartLine {
  productId: string;
  qty: number;
  product: Product;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, TranslocoModule, DbTranslatePipe],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {

  private readonly cartService = inject(CartService);
  private readonly productService = inject(ProductService);
  private readonly orderService = inject(OrderService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly translocoService = inject(TranslocoService);

  readonly today = new Date();
  readonly isLoading = signal(true);
  readonly isPlacing = signal(false);
  private readonly allProducts = signal<Product[]>([]);

  readonly cartLines = computed<CartLine[]>(() => {
    const items = this.cartService.items();
    const products = this.allProducts();
    return items
      .map(item => {
        const product = products.find(p => p.id === item.productId);
        return product ? { productId: item.productId, qty: item.qty, product } : null;
      })
      .filter((x): x is CartLine => x !== null);
  });

  readonly subtotal = computed(() =>
    this.cartLines().reduce((sum, line) => sum + line.product.price * line.qty, 0)
  );

  readonly countKey = computed(() => `cart.count.${this.cartLines().length}`);
  readonly thingsKey = computed(() =>
    this.cartLines().length === 1 ? 'cart.headline_thing' : 'cart.headline_things'
  );

  ngOnInit() {
    this.productService.getAvailable().subscribe({
      next: res => {
        this.allProducts.set(res.content);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  getImage(product: Product): string {
    return product.image || getProductImage(product.variety, product.category);
  }

  onImageError(e: Event) {
    (e.target as HTMLImageElement).style.display = 'none';
  }

  increase(productId: string) { this.cartService.increase(productId); }
  decrease(productId: string) { this.cartService.decrease(productId); }
  remove(productId: string) { this.cartService.set(productId, 0); }

  placeOrder() {
    const customer = this.authService.currentUser();
    if (!customer) {
      this.router.navigate(['/login']);
      return;
    }

    const lines = this.cartLines().map(line => ({
      productId: line.productId,
      quantity: line.qty
    }));

    if (lines.length === 0) return;

    this.isPlacing.set(true);

    this.orderService.create({ customerId: customer.id, lines }).subscribe({
      next: () => {
        this.cartService.clear();
        this.isPlacing.set(false);
        const msg = this.translocoService.translate('order.placed_success');
        this.toastService.success(msg);
        this.router.navigate(['/orders']);
      },
      error: () => {
        this.isPlacing.set(false);
        const msg = this.translocoService.translate('order.place_error');
        this.toastService.error(msg);
      }
    });
  }
}
