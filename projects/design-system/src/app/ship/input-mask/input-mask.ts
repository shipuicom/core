import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-input-mask',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './input-mask.html',
  styleUrl: './input-mask.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class InputMask {}
