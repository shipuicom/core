import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipDivider } from 'ship-ui';

@Component({
  selector: 'app-base-divider',
  standalone: true,
  imports: [ShipDivider],
  templateUrl: './base-divider.html',
  styleUrl: './base-divider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseDivider {}
