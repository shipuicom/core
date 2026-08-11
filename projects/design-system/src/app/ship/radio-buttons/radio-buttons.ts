import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-radio-buttons',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './radio-buttons.html',
  styleUrl: './radio-buttons.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RadioButtons {}
