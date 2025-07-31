import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipDividerComponent } from '@ship-ui/core';

@Component({
  selector: 'app-base-divider',
  standalone: true,
  imports: [ShipDividerComponent],
  templateUrl: './base-divider.component.html',
  styleUrl: './base-divider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseDividerComponent {}
