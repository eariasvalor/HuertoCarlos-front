import { Component, inject, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { TranslocoService, TranslocoModule } from '@ngneat/transloco';
import { CartService } from '../../core/services/cart-service';
import { ProductService } from '../../core/services/product.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Product } from '../../core/model/product.model';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslocoModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {

  private readonly authService = inject(AuthService);
  private readonly location = inject(Location);
  private readonly cartService = inject(CartService);
  private readonly productService = inject(ProductService);
  private readonly transloco = inject(TranslocoService);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly isAdmin = computed(() => this.authService.isAdmin());
  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());

  readonly langs = ['es', 'en', 'nl'];
  menuOpen = false;
  langOpen = false;
  cartOpen = false;

  get activeLang(): string {
    return this.transloco.getActiveLang();
  }

  readonly cartItemCount = this.cartService.itemCount;
  readonly cartItems = this.cartService.items;

  readonly products = toSignal(
    this.productService.getAvailable().pipe(
      map(res => res.content)
    ),
    { initialValue: [] as Product[] }
  );


  private readonly basePath = 'images/products/';

  private readonly extensions = ['.avif', '.jpg', '.webp'];

  private readonly imageMap: Record<string, string> = {
    'tomate corazon de buey': 'tomato-cordebou.jpg',
    'tomate pera': 'tomato-pera.jpg',
    'tomate rosa': 'tomato-rosadealtea.webp',
  };

  private readonly categoryFallback: Record<string, string> = {
    tomato: 'tomato-default.avif',
    onion: 'onion-default.jpg',
    lettuce: 'lettuce-default.avif',
    pepper: 'pepper-default.avif',
    garlic: 'garlic-default.avif',
    cucumber: 'cucumber.avif',
    zucchini: 'zuchini-default.avif',
    eggplant: 'eggplant-default.avif',
    vegetables: 'vegetables-default.avif',
  };

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .trim();
  }

  private detectCategory(name: string): string {
    if (name.includes('tomate')) return 'tomato';
    if (name.includes('cebolla')) return 'onion';
    if (name.includes('lechuga')) return 'lettuce';
    if (name.includes('pimiento')) return 'pepper';
    if (name.includes('ajo')) return 'garlic';
    if (name.includes('pepino')) return 'cucumber';
    if (name.includes('calabacin')) return 'zucchini';
    if (name.includes('berenjena')) return 'eggplant';

    return 'vegetables';
  }

  resolveImage(name: string): string {
    const normalized = this.normalize(name);

    if (this.imageMap[normalized]) {
      return this.basePath + this.imageMap[normalized];
    }

    const category = this.detectCategory(normalized);

    const slug = normalized.replace(/\s+/g, '-');
    const candidates = [
      slug,
      `${category}-${slug}`,
      `${category}-${slug.split('-').pop()}`
    ];

    return this.basePath + candidates[0] + '.avif';
  }

  onImageError(event: Event, name: string) {
    const img = event.target as HTMLImageElement;
    const normalized = this.normalize(name);
    const category = this.detectCategory(normalized);

    img.src = this.basePath + (this.categoryFallback[category] || 'vegetables-default.avif');
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

  checkout() {
    const customer = this.authService.currentUser();

    if (!customer) {
      this.router.navigate(['/login']);
      return;
    }

    const cart = this.cartService.items();

    const lines = cart.map(item => ({
      productId: item.productId,
      quantity: item.qty
    }));

    if (lines.length === 0) return;

    this.orderService.create({
      customerId: customer.id,
      lines
    }).subscribe({
      next: () => {
        this.cartService.clear?.();
        this.cartOpen = false;
        const msg = this.transloco.translate('order.placed_success');
        this.toastService.success(msg);
      },
      error: () => {
        const msg = this.transloco.translate('order.place_error');
        this.toastService.error(msg);
        console.error('Error placing order');
      }
    });
  }
}