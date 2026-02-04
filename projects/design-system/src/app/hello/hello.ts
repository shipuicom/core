import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShipButton, ShipChip, ShipDivider, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-hello',
  imports: [ShipButton, ShipIcon, ShipChip, ShipDivider, RouterLink],
  templateUrl: './hello.html',
  styleUrl: './hello.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Hello {
  protected window = window;
}
