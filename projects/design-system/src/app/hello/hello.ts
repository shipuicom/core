import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipDivider } from '@ship-ui/core/ship-divider';
import { ShipIcon } from '@ship-ui/core/ship-icon';
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
