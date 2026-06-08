import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-base-button',
  imports: [ShipIcon, ShipButton],
  templateUrl: './base-button.html',
  styleUrl: './base-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseButton {}
