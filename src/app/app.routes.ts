import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { adminGuard } from './core/auth/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/catalogue/catalogue.component').then(m => m.CatalogueComponent)
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/orders/orders.component').then(m => m.OrdersComponent)
  },
  {
    path: 'orders/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/order-detail/order-detail.component').then(m => m.OrderDetailComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
  path: 'admin/login',
  loadComponent: () =>
    import('./components/admin/admin-login/admin-login.component').then(m => m.AdminLoginComponent)
},
  {
    path: 'admin-dashboard',
    pathMatch: 'full',
    redirectTo: 'admin'
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./components/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'admin/products',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./components/admin/admin-products/admin-products.component').then(m => m.AdminProductsComponent)
  },
  {
    path: 'admin/varieties',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./components/admin/admin-varieties/admin-varieties.component').then(m => m.AdminVarietiesComponent)
  },
  {
    path: 'admin/orders',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./components/admin/admin-orders/admin-orders.component').then(m => m.AdminOrdersComponent)
  },
  {
    path: 'admin/customers',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./components/admin/admin-customers/admin-customers.component').then(m => m.AdminCustomersComponent)
  },
  {
    path: 'admin/notifications/new',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./components/admin/admin-notifications-new/admin-notifications-new')
        .then(m => m.AdminNotifications)
  },
  { path: '**', redirectTo: '' }
];
