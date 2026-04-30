import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/auth/auth.service';
import { Order, OrderStatus } from '../../core/model/order.model';
import { Location } from '@angular/common';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { DbTranslatePipe } from '../../core/pipes/db-translate.pipe';

type SortKey = 'date_desc' | 'date_asc' | 'total_desc' | 'total_asc';
type FilterStatus = OrderStatus | 'ALL';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, TranslocoModule, DbTranslatePipe],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {

  private readonly orderService = inject(OrderService);
  private readonly authService = inject(AuthService);
  private readonly location = inject(Location);
  private readonly translocoService = inject(TranslocoService);

  readonly orders = signal<Order[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly cancellingId = signal<string | null>(null);

  readonly activeFilter = signal<FilterStatus>('ALL');
  readonly sortKey = signal<SortKey>('date_desc');

  readonly filteredOrders = computed(() => {
    let list = this.orders();
    const f = this.activeFilter();
    if (f !== 'ALL') {
      list = list.filter(o => o.status === f);
    }
    const s = this.sortKey();
    return [...list].sort((a, b) => {
      switch (s) {
        case 'date_desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date_asc':  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'total_desc': return b.total - a.total;
        case 'total_asc':  return a.total - b.total;
      }
    });
  });

  readonly filterStatuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'READY_FOR_PICKUP', 'DELIVERED', 'CANCELLED'];

  public steps = ['pending', 'confirmed', 'ready', 'delivered'];

  setFilter(status: FilterStatus) { this.activeFilter.set(status); }
  setSort(event: Event) { this.sortKey.set((event.target as HTMLSelectElement).value as SortKey); }

  ngOnInit() {
    this.loadOrders();
  }

  goBack() {
    this.location.back();
  }

  loadOrders() {
    const customer = this.authService.currentUser();
    if (!customer) return;

    this.isLoading.set(true);

    this.orderService.getMyOrders(customer.id).subscribe({
      next: res => {
        this.orders.set(res.content);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set(this.translocoService.translate('orders.states.load_error'));
        this.isLoading.set(false);
      }
    });
  }

  cancelOrder(orderId: string) {
    this.cancellingId.set(orderId);

    this.orderService.cancel(orderId).subscribe({
      next: updated => {
        this.orders.update(orders =>
          orders.map(o => o.id === orderId ? updated : o)
        );
        this.cancellingId.set(null);
      },
      error: () => {
        this.errorMessage.set(this.translocoService.translate('orders.states.cancel_error'));
        this.cancellingId.set(null);
      }
    });
  }


  canCancel(order: Order): boolean {
    return order.status === 'PENDING' || order.status === 'CONFIRMED';
  }


  mapStatus(status: string): string {
    switch (status.toUpperCase()) {
      case 'PENDING':       return 'pending';
      case 'CONFIRMED':     return 'confirmed';
      case 'READY_FOR_PICKUP': return 'ready';
      case 'DELIVERED':     return 'delivered';
      case 'CANCELLED':     return 'cancelled';
      default:              return 'pending';
    }
  }

  isStepDone(current: string, step: string): boolean {
    const mapped = this.mapStatus(current);
    return this.steps.indexOf(step) < this.steps.indexOf(mapped);
  }

  isStepActive(current: string, step: string): boolean {
    return this.mapStatus(current) === step;
  }

  statusLabel(status: OrderStatus): string {
    const keyMap: Record<OrderStatus, string> = {
      PENDING: 'orders.status.pending',
      CONFIRMED: 'orders.status.confirmed',
      READY_FOR_PICKUP: 'orders.status.ready',
      DELIVERED: 'orders.status.delivered',
      CANCELLED: 'orders.status.cancelled'
    };
    return this.translocoService.translate(keyMap[status]);
  }

  statusClass(status: OrderStatus): string {
    const classes: Record<OrderStatus, string> = {
      PENDING: 'status-pending',
      CONFIRMED: 'status-confirmed',
      READY_FOR_PICKUP: 'status-ready',
      DELIVERED: 'status-delivered',
      CANCELLED: 'status-cancelled'
    };
    return classes[status];
  }
}