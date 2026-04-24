import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

import { importProvidersFrom, Injectable } from '@angular/core';
import { HttpClient, HttpClientModule, provideHttpClient } from '@angular/common/http';

import {
  TranslocoModule,
  TRANSLOCO_CONFIG,
  translocoConfig,
  TRANSLOCO_LOADER,
  TRANSLOCO_TRANSPILER,
  DefaultTranspiler,
  TRANSLOCO_MISSING_HANDLER,
  TRANSLOCO_INTERCEPTOR,
  TRANSLOCO_FALLBACK_STRATEGY,
  TranslocoService,
  TranslocoLoader,
  DefaultFallbackStrategy,
  provideTransloco
} from '@ngneat/transloco';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string): Observable<any> {
    return this.http.get(`assets/i18n/${lang}.json`);
  }
}

const savedLang = localStorage.getItem('lang') || 'es';

class SimpleMissingHandler {
  handle(key: string, params?: Record<string, any>) {
    return key;
  }
}

bootstrapApplication(App, {
  providers: [
    ...appConfig.providers,

    provideHttpClient(),

    provideTransloco({
      config: translocoConfig({
        availableLangs: ['en', 'es', 'nl'],
        defaultLang: 'es',
        fallbackLang: 'es',
        reRenderOnLangChange: true,
        prodMode: false
      }),
      loader: TranslocoHttpLoader
    })
  ]
});

