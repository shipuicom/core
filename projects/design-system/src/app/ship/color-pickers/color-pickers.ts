import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-color-pickers',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './color-pickers.html',
  styleUrl: './color-pickers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ColorPickers {}
