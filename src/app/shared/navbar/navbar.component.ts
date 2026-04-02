import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

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

  goBack() {
    this.location.back();
  }

  logout() {
    this.authService.logout();
  }
}