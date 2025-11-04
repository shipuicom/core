import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipDivider } from 'ship-ui';

@Component({
  selector: 'app-base-divider',
  standalone: true,
  imports: [ShipDivider],
  templateUrl: './base-divider.component.html',
  styleUrl: './base-divider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseDividerComponent {}
