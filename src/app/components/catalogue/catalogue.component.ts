import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-catalogue',
  imports: [],
  templateUrl: './catalogue.component.html',
  styleUrl: './catalogue.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogueComponent { }
