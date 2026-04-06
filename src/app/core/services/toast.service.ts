import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {

  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private nextId = 0;

  success(message: string) { this.add(message, 'success'); }
  error(message: string) { this.add(message, 'error'); }
  warning(message: string) { this.add(message, 'warning'); }

  dismiss(id: number) {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  private add(message: string, type: ToastType) {
    const id = this.nextId++;
    this._toasts.update(list => [...list, { id, message, type }]);
    setTimeout(() => this.dismiss(id), 4000);
  }
}