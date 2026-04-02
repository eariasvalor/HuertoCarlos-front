import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, PageResponse } from '../model/product.model';
import { environment } from '../../../environments/environment';

export interface CreateProductRequest {
  name: string;
  varietyId: string;
  price: number;
  unit: string;
  stock: number;
}

export interface UpdateProductRequest {
  name: string;
  varietyId: string;
  price: number;
  unit: string;
}

export interface UpdateStockRequest {
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {

  private readonly http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  getAvailable(page = 0, size = 20): Observable<PageResponse<Product>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<Product>>(`${this.API}/products`, { params });
  }

  getAll(page = 0, size = 50): Observable<PageResponse<Product>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<Product>>(`${this.API}/admin/products`, { params });
  }

  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.API}/products/${id}`);
  }

  create(request: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(`${this.API}/products`, request);
  }

  update(id: string, request: UpdateProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.API}/products/${id}`, request);
  }

  updateStock(id: string, request: UpdateStockRequest): Observable<Product> {
    return this.http.patch<Product>(`${this.API}/products/${id}/stock`, request);
  }

  toggleAvailability(id: string): Observable<Product> {
    return this.http.patch<Product>(`${this.API}/products/${id}/availability`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/products/${id}`);
  }
}