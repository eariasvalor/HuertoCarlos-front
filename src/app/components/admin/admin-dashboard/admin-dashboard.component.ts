import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  imports: [],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent { }
