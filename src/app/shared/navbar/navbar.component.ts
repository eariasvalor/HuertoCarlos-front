import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {

  private readonly authService = inject(AuthService);
  private readonly location = inject(Location);
  readonly isAdmin = computed(() => this.authService.isAdmin());

  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());

  private readonly transloco = inject(TranslocoService);
  readonly langs = ['es', 'en'];

  menuOpen = false;

  get activeLang(): string {
    return this.transloco.getActiveLang();
  }

  langOpen: boolean = false;

  toggleLang() {
    this.langOpen = !this.langOpen;
  }

  closeLang() {
    this.langOpen = false;
  }

  setLanguage(lang: string) {
    if (lang === this.activeLang) return;
  
    this.transloco.setActiveLang(lang);
    localStorage.setItem('lang', lang);
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
  
  closeMenu() {
    this.menuOpen = false;
  }

  goBack() {
    this.location.back();
  }

  logout() {
    this.authService.logout();
  }
}