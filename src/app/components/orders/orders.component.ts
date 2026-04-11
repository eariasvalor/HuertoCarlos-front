import { Component, inject, signal, computed, OnInit } from '@angular/core';
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

  public steps = ['pending', 'confirmed', 'preparation', 'ready'];

  mapStatus(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending confirmation':
      case 'pending':
        return 'pending';
  
      case 'confirmed':
        return 'confirmed';
  
      case 'in preparation':
      case 'preparation':
        return 'preparation';
  
      case 'ready':
        return 'ready';
  
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
    return order.status === 'PENDING_CONFIRMATION' || order.status === 'CONFIRMED';
  }

  statusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      PENDING_CONFIRMATION: 'Pending confirmation',
      CONFIRMED: 'Confirmed',
      IN_PREPARATION: 'In preparation',
      READY_FOR_PICKUP: 'Ready for pickup',
      CANCELLED: 'Cancelled'
    };
    return labels[status];
  }

  statusClass(status: OrderStatus): string {
    const classes: Record<OrderStatus, string> = {
      PENDING_CONFIRMATION: 'status-pending',
      CONFIRMED: 'status-confirmed',
      IN_PREPARATION: 'status-preparation',
      READY_FOR_PICKUP: 'status-ready',
      CANCELLED: 'status-cancelled'
    };
    return classes[status];
  }
}