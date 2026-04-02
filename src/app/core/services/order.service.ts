import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, CreateOrderRequest } from '../model/order.model';
import { PageResponse } from '../model/product.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrderService {

  private readonly http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  create(request: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${this.API}/orders`, request);
  }

  getById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.API}/orders/${id}`);
  }

  getMyOrders(customerId: string, page = 0, size = 20): Observable<PageResponse<Order>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
    return this.http.get<PageResponse<Order>>(`${this.API}/orders`, { params });
  }

  cancel(id: string): Observable<Order> {
    return this.http.patch<Order>(`${this.API}/orders/${id}/cancel`, {});
  }
}