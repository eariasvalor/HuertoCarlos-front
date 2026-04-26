import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart-service';
import { AuthService } from '../../core/auth/auth.service';
import { Product } from '../../core/model/product.model';
import { getProductImage } from '../../core/utils/product-image.util';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { TranslocoModule } from '@ngneat/transloco';
import { DbTranslatePipe } from '../../core/pipes/db-translate.pipe';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, TranslocoModule, DbTranslatePipe],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);

  readonly today = new Date();

  readonly product = signal<Product | null>(null);
  readonly isLoading = signal(true);
  readonly qty = signal(1);
  readonly added = signal(false);

  readonly total = computed(() => {
    const p = this.product();
    return p ? p.price * this.qty() : 0;
  });

  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.productService.getById(id).subscribe({
      next: product => {
        this.product.set(product);
        const cartQty = this.cartService.getQuantity(product.id);
        this.qty.set(cartQty > 0 ? cartQty : 1);
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

  increaseQty() {
    const p = this.product();
    if (p && this.qty() >= p.stock) return;
    this.qty.update(q => q + 1);
  }

  decreaseQty() {
    this.qty.update(q => Math.max(1, q - 1));
  }

  goBack() {
    this.location.back();
  }

  addToBasket() {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    const product = this.product();
    if (!product) return;
    this.cartService.set(product.id, this.qty());
    this.added.set(true);
    setTimeout(() => this.added.set(false), 2000);
  }
}
