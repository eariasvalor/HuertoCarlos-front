import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private readonly http = inject(HttpClient);
  private readonly API = environment.apiUrl;

sendNotification(
    customerIds: string[],
    messageText: string,
    file?: File
  ): Observable<any> {
  
    let params = new HttpParams().set('messageText', messageText);
    customerIds.forEach(id => {
      params = params.append('customerIds', id);
    });

    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }

    return this.http.post(`${this.API}/admin/notifications`, formData, { params });
  }
}