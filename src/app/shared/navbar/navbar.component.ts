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

  private readonly wordMap: Record<string, string> = {
    tomate: 'tomato',
    cebolla: 'onion',
    lechuga: 'lettuce',
    pimiento: 'pepper',
    ajo: 'garlic',
    pepino: 'cucumber',
    calabacin: 'calabacin',
    berenjena: 'eggplant',
    pera: 'pera',
    cherry: 'cherry',
    corazon: 'cordebou',
    buey: 'cordebou',
    rosa: 'rosadealtea',

    blanca: 'blanca',
    morada: 'morada',
    tierna: 'tierna',

    italiano: 'italiano',
    padron: 'padron',
    morronrojo: 'morronrojo',
    morronverde: 'morronverde',
  };

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, '')
      .trim();
  }

  resolveImage(name: string): string {
    const normalized = this.normalize(name);
    const words = normalized.split(' ');

    const mappedWords = words.map(w => this.wordMap[w] || w);

    const category = mappedWords[0];
    const variant = mappedWords.slice(1).join('');

    const filename = variant
      ? `${category}-${variant}`
      : category;

    return `${this.basePath}${filename}.avif`;
  }

  onImageError(event: Event, name: string) {
    const img = event.target as HTMLImageElement;
    const normalized = this.normalize(name);

    if (normalized.includes('tomate')) {
      img.src = this.basePath + 'tomato-default.avif';
    } else if (normalized.includes('cebolla')) {
      img.src = this.basePath + 'onion-default.jpg';
    } else if (normalized.includes('lechuga')) {
      img.src = this.basePath + 'lettuce-default.avif';
    } else if (normalized.includes('pimiento')) {
      img.src = this.basePath + 'pepper-default.avif';
    } else {
      img.src = this.basePath + 'vegetables-default.avif';
    }
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