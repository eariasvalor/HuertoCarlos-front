import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/auth/auth.service';
import { Order, OrderStatus } from '../../core/model/order.model';
import { Location } from '@angular/common';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {

  private readonly orderService = inject(OrderService);
  private readonly authService = inject(AuthService);
  private readonly location = inject(Location);

  readonly orders = signal<Order[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly cancellingId = signal<string | null>(null);

  // 🔥 Backend actual
  public steps = ['pending', 'confirmed', 'ready', 'delivered'];

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
        this.errorMessage.set('Could not load your orders. Please try again.');
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
        this.errorMessage.set('Could not cancel order. Please try again.');
        this.cancellingId.set(null);
      }
    });
  }


  canCancel(order: Order): boolean {
    return order.status === 'PENDING' || order.status === 'CONFIRMED';
  }


  mapStatus(status: string): string {
    switch (status.toUpperCase()) {

      case 'PENDING':
        return 'pending';

      case 'CONFIRMED':
        return 'confirmed';

      case 'READY_FOR_PICKUP':
        return 'ready';

      case 'DELIVERED':
        return 'delivered';

      case 'CANCELLED':
        return 'pending';

      default:
        return 'pending';
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
    const labels: Record<OrderStatus, string> = {
      PENDING: 'Pending',
      CONFIRMED: 'Confirmed',
      READY_FOR_PICKUP: 'Ready for pickup',
      DELIVERED: 'Delivered',
      CANCELLED: 'Cancelled'
    };
    return labels[status];
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