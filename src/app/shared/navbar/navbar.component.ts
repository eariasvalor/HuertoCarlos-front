import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { TranslocoService } from '@ngneat/transloco';
import { CartService } from '../../core/services/cart-service';
import { ProductService } from '../../core/services/product.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Product } from '../../core/model/product.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {

  private readonly authService = inject(AuthService);
  private readonly location = inject(Location);
  private readonly cartService = inject(CartService);
  private readonly productService = inject(ProductService);
  private readonly transloco = inject(TranslocoService);

  // =========================
  // AUTH
  // =========================
  readonly isAdmin = computed(() => this.authService.isAdmin());
  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());

  // =========================
  // UI STATE
  // =========================
  readonly langs = ['es', 'en'];
  menuOpen = false;
  langOpen = false;
  cartOpen = false;

  get activeLang(): string {
    return this.transloco.getActiveLang();
  }

  // =========================
  // CART
  // =========================
  readonly cartItemCount = this.cartService.itemCount;
  readonly cartItems = this.cartService.items;

  // =========================
  // PRODUCTS (API → SIGNAL)
  // =========================
  readonly products = toSignal(
    this.productService.getAvailable().pipe(
      map(res => res.content)
    ),
    { initialValue: [] as Product[] }
  );


  private readonly imageMap: Record<string, string> = {
    'tomate raf': 'tomato-raf',
    'tomate cherry': 'tomato-cherry',
    'tomate corazón de buey': 'tomato-cordebou',
  };

  private resolveImage(name: string): string {
    console.log('Resolving image for:', name);
    const key = name.toLowerCase().trim();
  
    const mapped = this.imageMap[key];
  
    if (mapped) {
      return `images/products/${mapped}.jpg`;
    }
  
    return `images/products/tomato-default.jpg`;
  }

  readonly cartItemsDetailed = computed(() => {
    const cart = this.cartService.items();
    const products = this.products();

    return cart.map(item => {
      const product = products.find((p: Product) => p.id === item.productId);

      const name = product?.name ?? 'Unknown';

      return {
        productId: item.productId,
        qty: item.qty,
        name,
        price: product?.price ?? 0,
        image: this.resolveImage(name)
      };
    });
  });

  readonly total = computed(() => {
    return this.cartItemsDetailed().reduce((sum, item) => {
      return sum + item.price * item.qty;
    }, 0);
  });

  increase(productId: string) {
    this.cartService.increase(productId);
  }

  decrease(productId: string) {
    this.cartService.decrease(productId);
  }

  toggleCart() {
    this.cartOpen = !this.cartOpen;
  }

  toggleLang() {
    this.langOpen = !this.langOpen;
  }

  closeLang() {
    this.langOpen = false;
  }

  setLanguage(lang: string) {
    if (lang === this.activeLang) return;

    this.transloco.setActiveLang(lang);
    localStorage.setItem('lang', lang);
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  goBack() {
    this.location.back();
  }

  logout() {
    this.authService.logout();
  }
}