import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipTabs } from '@ship-ui/core/ship-tabs';

@Component({
  selector: 'app-toggles',
  imports: [ShipTabs, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './toggles.html',
  styleUrl: './toggles.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Toggles {}
