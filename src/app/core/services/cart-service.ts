import { Injectable, signal, computed } from '@angular/core';

interface CartItem {
  productId: string;
  qty: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {

  private readonly cart = signal<Map<string, number>>(new Map());

  readonly items = computed<CartItem[]>(() => {
    return Array.from(this.cart().entries()).map(([productId, qty]) => ({
      productId,
      qty
    }));
  });

  readonly itemCount = computed(() => {
    let count = 0;
    this.cart().forEach(qty => count += qty);
    return count;
  });

  getQuantity(productId: string) {
    return this.cart().get(productId) ?? 0;
  }

  increase(productId: string) {
    const newCart = new Map(this.cart());
    newCart.set(productId, (newCart.get(productId) ?? 0) + 1);
    this.cart.set(newCart);
  }

  decrease(productId: string) {
    const newCart = new Map(this.cart());
    const qty = newCart.get(productId) ?? 0;

    if (qty <= 1) newCart.delete(productId);
    else newCart.set(productId, qty - 1);

    this.cart.set(newCart);
  }

  set(productId: string, qty: number) {
    const newCart = new Map(this.cart());
    if (qty <= 0) newCart.delete(productId);
    else newCart.set(productId, qty);
    this.cart.set(newCart);
  }

  clear() {
    this.cart.set(new Map());
  }
}