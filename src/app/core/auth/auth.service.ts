import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { LoginRequest, RegisterRequest, TokenResponse } from '../model/auth.model';
import { Customer } from '../model/customer.model';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly API = 'http://localhost:8080/api/v1';
  private readonly TOKEN_KEY = 'huerto_token';
  private readonly USER_KEY = 'huerto_user';
  

  // --- Signals ---
  private _token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));
  private _currentUser = signal<Customer | null>(
    JSON.parse(localStorage.getItem(this.USER_KEY) ?? 'null')
  );

  readonly isAuthenticated = computed(() => !!this._token());
  readonly currentUser = this._currentUser.asReadonly();
  readonly token = this._token.asReadonly();

  readonly isAdmin = computed(() => {
  const token = this._token();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role === 'ADMIN';
  } catch {
    return false;
  }
});

  // --- Auth actions ---

  login(request: LoginRequest) {
    return this.http.post<TokenResponse>(`${this.API}/auth/login/customer`, request).pipe(
      tap(response => {
        this.saveToken(response.token);
        this.loadCurrentUser();
      })
    );
  }

  register(request: RegisterRequest) {
    return this.http.post<Customer>(`${this.API}/auth/register`, request).pipe(
      tap(customer => {
        localStorage.setItem(this.USER_KEY, JSON.stringify(customer));
        this._currentUser.set(customer);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._token.set(null);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  // --- Private ---

  private saveToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
    this._token.set(token);
  }

  private loadCurrentUser() {
    const userId = this.extractUserIdFromToken();
    if (!userId) return;

    this.http.get<Customer>(`${this.API}/customers/${userId}`, {
      headers: { Authorization: `Bearer ${this._token()}` }
    }).pipe(
      tap(customer => {
        localStorage.setItem(this.USER_KEY, JSON.stringify(customer));
        this._currentUser.set(customer);
      })
    ).subscribe();
  }

  private extractUserIdFromToken(): string | null {
    const token = this._token();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub ?? null;
    } catch {
      return null;
    }
  }
}