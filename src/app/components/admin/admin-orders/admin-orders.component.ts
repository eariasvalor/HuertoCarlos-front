import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { OrderService } from '../../../core/services/order.service';
import { CustomerService } from '../../../core/services/customer.service';
import { Order, OrderStatus } from '../../../core/model/order.model';
import { Customer } from '../../../core/model/customer.model';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss'
})
export class AdminOrdersComponent implements OnInit {

  private readonly orderService = inject(OrderService);
  private readonly customerService = inject(CustomerService);

  readonly orders = signal<Order[]>([]);
  readonly customers = signal<Customer[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedStatus = signal<string>('All');
  readonly selectedCustomerId = signal<string>('All');
  readonly processingId = signal<string | null>(null);

  ngOnInit() {
    this.loadCustomers();
    this.loadOrders();
  }

  loadCustomers() {
    this.customerService.getAll().subscribe({
      next: res => this.customers.set(res.content)
    });
  }

  loadOrders() {
    this.isLoading.set(true);
    const status = this.selectedStatus() !== 'All' ? this.selectedStatus() : undefined;
    const customerId = this.selectedCustomerId() !== 'All' ? this.selectedCustomerId() : undefined;

    this.orderService.getAll(0, 50, status, customerId).subscribe({
      next: res => {
        this.orders.set(res.content);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load orders. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  selectStatus(status: string) {
    this.selectedStatus.set(status);
    this.loadOrders();
  }

  selectCustomer(customerId: string) {
    this.selectedCustomerId.set(customerId);
    this.loadOrders();
  }

  confirm(orderId: string) {
    this.processingId.set(orderId);
    this.orderService.confirm(orderId).subscribe({
      next: updated => this.updateOrder(updated),
      error: () => { this.errorMessage.set('Could not confirm order.'); this.processingId.set(null); }
    });
  }

  startPreparation(orderId: string) {
    this.processingId.set(orderId);
    this.orderService.startPreparation(orderId).subscribe({
      next: updated => this.updateOrder(updated),
      error: () => { this.errorMessage.set('Could not start preparation.'); this.processingId.set(null); }
    });
  }

  markReady(orderId: string) {
    this.processingId.set(orderId);
    this.orderService.markReady(orderId).subscribe({
      next: updated => this.updateOrder(updated),
      error: () => { this.errorMessage.set('Could not mark order as ready.'); this.processingId.set(null); }
    });
  }

  revert(orderId: string) {
    this.processingId.set(orderId);
    this.orderService.revert(orderId).subscribe({
      next: updated => this.updateOrder(updated),
      error: () => { this.errorMessage.set('Could not revert order.'); this.processingId.set(null); }
    });
  }

  cancel(orderId: string) {
    this.processingId.set(orderId);
    this.orderService.cancel(orderId).subscribe({
      next: updated => this.updateOrder(updated),
      error: () => { this.errorMessage.set('Could not cancel order.'); this.processingId.set(null); }
    });
  }

  private updateOrder(updated: Order) {
    this.orders.update(orders => orders.map(o => o.id === updated.id ? updated : o));
    this.processingId.set(null);
  }

  nextAction(status: OrderStatus): string | null {
    const actions: Partial<Record<OrderStatus, string>> = {
      PENDING_CONFIRMATION: 'Confirm',
      CONFIRMED: 'Start preparation',
      IN_PREPARATION: 'Mark ready'
    };
    return actions[status] ?? null;
  }

  canRevert(status: OrderStatus): boolean {
    return status === 'CONFIRMED' || status === 'IN_PREPARATION';
  }

  canCancel(status: OrderStatus): boolean {
    return status !== 'CANCELLED' && status !== 'READY_FOR_PICKUP';
  }

  statusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      PENDING_CONFIRMATION: 'Pending',
      CONFIRMED: 'Confirmed',
      IN_PREPARATION: 'In preparation',
      READY_FOR_PICKUP: 'Ready',
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

  executeNextAction(order: Order) {
    const actions: Partial<Record<OrderStatus, (id: string) => void>> = {
      PENDING_CONFIRMATION: id => this.confirm(id),
      CONFIRMED: id => this.startPreparation(id),
      IN_PREPARATION: id => this.markReady(id)
    };
    actions[order.status]?.(order.id);
  }
}