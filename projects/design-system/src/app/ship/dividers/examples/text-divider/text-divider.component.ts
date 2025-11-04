import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipDivider } from 'ship-ui';

@Component({
  selector: 'app-text-divider',
  standalone: true,
  imports: [ShipDivider],
  templateUrl: './text-divider.html',
  styleUrl: './text-divider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextDividerComponent {}
