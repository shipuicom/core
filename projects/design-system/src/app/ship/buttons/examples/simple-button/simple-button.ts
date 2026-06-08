import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-simple-button',
  imports: [ShipIcon, ShipButton],
  templateUrl: './simple-button.html',
  styleUrl: './simple-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleButton {}
