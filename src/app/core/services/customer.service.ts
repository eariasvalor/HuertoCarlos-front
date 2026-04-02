import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Customer } from '../model/customer.model';
import { environment } from '../../../environments/environment';
import { PageResponse } from '../model/product.model';


export interface UpdateCustomerRequest {
  name: string;
  rawPassword?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {

  private readonly http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  getById(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.API}/customers/${id}`);
  }

  update(id: string, request: UpdateCustomerRequest): Observable<Customer> {
    return this.http.put<Customer>(`${this.API}/customers/${id}`, request);
  }

  getAll(page = 0, size = 100): Observable<PageResponse<Customer>> {
  const params = new HttpParams()
    .set('page', page)
    .set('size', size);
  return this.http.get<PageResponse<Customer>>(`${this.API}/customers`, { params });
}
}