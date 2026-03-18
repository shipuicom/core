import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShipButton, ShipChip, ShipDivider, ShipIcon } from 'ship-ui';
import { WINDOW } from '../core/providers/window';

@Component({
  selector: 'app-hello',
  imports: [ShipButton, ShipIcon, ShipChip, ShipDivider, RouterLink],
  templateUrl: './hello.html',
  styleUrl: './hello.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Hello {
  protected window = inject(WINDOW);
}
