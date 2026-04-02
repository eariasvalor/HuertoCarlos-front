import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { OrderService } from '../../../core/services/order.service';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { OrderStats } from '../../../core/model/order.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent {

  private readonly orderService = inject(OrderService);
  

  readonly stats = toSignal(this.orderService.getStats());
}