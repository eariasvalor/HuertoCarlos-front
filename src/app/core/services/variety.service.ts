import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Variety, PageResponse } from '../model/variety.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VarietyService {

  private readonly http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  getAll(page = 0, size = 100): Observable<PageResponse<Variety>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<Variety>>(`${this.API}/varieties`, { params });
  }

  getList(): Observable<Variety[]> {
    return this.getAll().pipe(map(res => res.content));
  }

  create(name: string, productCategory: string): Observable<Variety> {
    return this.http.post<Variety>(`${this.API}/varieties`, { name, productCategory });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/varieties/${id}`);
  }
}