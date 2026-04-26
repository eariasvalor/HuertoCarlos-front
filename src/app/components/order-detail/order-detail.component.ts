import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { OrderService } from '../../core/services/order.service';
import { Order, OrderStatus } from '../../core/model/order.model';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { DbTranslatePipe } from '../../core/pipes/db-translate.pipe';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, TranslocoModule, DbTranslatePipe],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.scss'
})
export class OrderDetailComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly location = inject(Location);
  private readonly translocoService = inject(TranslocoService);

  readonly order = signal<Order | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly cancelling = signal(false);

  readonly steps = ['pending', 'confirmed', 'ready', 'delivered'];

  readonly timelineSteps = [
    { key: 'pending',   label: 'orders.detail.steps.received',  desc: 'orders.detail.steps.desc_received' },
    { key: 'confirmed', label: 'orders.detail.steps.confirmed', desc: 'orders.detail.steps.desc_confirmed' },
    { key: 'ready',     label: 'orders.detail.steps.ready',     desc: 'orders.detail.steps.desc_ready' },
    { key: 'delivered', label: 'orders.detail.steps.delivered', desc: 'orders.detail.steps.desc_delivered' }
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.orderService.getById(id).subscribe({
      next: order => {
        this.order.set(order);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set(this.translocoService.translate('orders.states.load_error'));
        this.isLoading.set(false);
      }
    });
  }

  goBack() {
    this.location.back();
  }

  cancelOrder() {
    const order = this.order();
    if (!order) return;
    this.cancelling.set(true);

    this.orderService.cancel(order.id).subscribe({
      next: updated => {
        this.order.set(updated);
        this.cancelling.set(false);
      },
      error: () => {
        this.errorMessage.set(this.translocoService.translate('orders.states.cancel_error'));
        this.cancelling.set(false);
      }
    });
  }

  canCancel(order: Order): boolean {
    return order.status === 'PENDING' || order.status === 'CONFIRMED';
  }

  mapStatus(status: string): string {
    switch (status.toUpperCase()) {
      case 'PENDING':          return 'pending';
      case 'CONFIRMED':        return 'confirmed';
      case 'READY_FOR_PICKUP': return 'ready';
      case 'DELIVERED':        return 'delivered';
      case 'CANCELLED':        return 'cancelled';
      default:                 return 'pending';
    }
  }

  isStepDone(current: string, step: string): boolean {
    const mapped = this.mapStatus(current);
    return this.steps.indexOf(step) < this.steps.indexOf(mapped);
  }

  isStepActive(current: string, step: string): boolean {
    return this.mapStatus(current) === step;
  }

  statusHero(status: OrderStatus): { start: string; italic: string; subtitle: string } {
    return {
      start:    this.translocoService.translate(`orders.detail.hero.${status}.start`),
      italic:   this.translocoService.translate(`orders.detail.hero.${status}.italic`),
      subtitle: this.translocoService.translate(`orders.detail.hero.${status}.subtitle`)
    };
  }

  statusLabel(status: OrderStatus): string {
    const keyMap: Record<OrderStatus, string> = {
      PENDING:          'orders.status.pending',
      CONFIRMED:        'orders.status.confirmed',
      READY_FOR_PICKUP: 'orders.status.ready',
      DELIVERED:        'orders.status.delivered',
      CANCELLED:        'orders.status.cancelled'
    };
    return this.translocoService.translate(keyMap[status]);
  }

  statusClass(status: OrderStatus): string {
    const classes: Record<OrderStatus, string> = {
      PENDING:          'status-pending',
      CONFIRMED:        'status-confirmed',
      READY_FOR_PICKUP: 'status-ready',
      DELIVERED:        'status-delivered',
      CANCELLED:        'status-cancelled'
    };
    return classes[status];
  }
}
